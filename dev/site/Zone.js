define(['hance', 'jquery', 'crown.utils/Uri', 'hammer', 'history', 'crown.shim/animation'], function (crown, $, Uri) {
    var Scheme = hance.inherit("crown.site.Scene", function () { });
    Scheme.options = {combineZones:true, zones:null};
    var proto = Scheme.prototype;
    proto.init = function (options) {
        this.options = $.extend({}, Scheme.options, options);
        this.name = this.options.name;
        this._combineZones = this.options.combineZones;
        this._zones = this.options.zones;
    };
    proto.insertHtml = function (html) {
        for(var i = 0, il = html.length; i < il; i++){
            var item = html[i];
            $(item.content).appendTo(item.container);
        }
    };
    proto.load = function (paper) {
        if (paper) {
            this.insertHtml(paper.html);
        }
        var deferreds = [], self = this;
        if (this._zones == null){
            if(paper && paper.data && paper.data.zones){
                this._zones = paper.data.zones;
            }else if (this.name){
                this._zones = [];
                $('.hn-scene-element[data-scene-name=' + this.name + '] .hn-zone').each(function(index){
                    var $this = $(this), 
                        order = $this.data('order'), 
                        name = $this.data('name'), 
                        url = $this.data('url');
                    if (order === undefined){
                        order = index;
                    }
                    if (url) {
                        url = Uri.absolute(url);
                    }
                    self._zones.push({name:name, container:$this.parent()[0], order:order, useCache: true, url:url});
                });
            }
        }
        for (var i = 0, il = this._zones.length; i < il; i++) {
            var zone = this._zones[i];
            if (zone.order === undefined) {
                zone.order = i;
            }
            if (zone.url === undefined) {
                var $link = $('.hn-zone-link[data-zone-name=' + zone.name + ']');
                zone.url = Uri.absolute($link.attr('href') || $link.data('href'));
                if (!zone.url) {
                    console.error('Can not get zone url from link. zone name:', zone.name);
                }
            }
            zone.$element = $('.hn-zone[data-name=' + zone.name + ']');
            zone.$container = $(zone.container) ||zone.$element.data('parent-container');
            zone.loaded = zone.$element.length > 0;
            if (zone.loaded) {
                zone.$element.attr('data-order', zone.order);
                if (zone.title === undefined) {
                    zone.title = $('head>title').html();
                }
            } else {
                if (this._combineZones) {
                    deferreds.push(this.loadZone(zone));
                }
            }
        }
        if (this._combineZones) {
            stage.getSpinner().watch(deferreds);
            return $.when.apply(null, deferreds).then(function () {
                stage.updateLinks();
            });
        } else {
            stage.updateLinks();
            return $.Deferred().resolve();
        }
    };
    proto.getZoneElement = function (html) {
        return html[0].element;
    };
    proto.inisertZoneElement = function (html, zone) {
        var $existZones = zone.$container.find('.hn-zone'), $html = $(html);
        if ($existZones.length > 0) {
            for (var i = 0, il = $existZones.length; i < il; i++) {
                var $prevZone = $existZones.eq(i),
                    $nextZone = (i === il - 1 ? null : $existZones.eq(i + 1));
                if ($prevZone.data('order') <= zone.order && ($nextZone == null || $nextZone.data('order') >= zone.order)) {
                    zone.$element = $html.insertAfter($prevZone).data('order', zone.order);
                } else if (i === 0 && $prevZone.data('order') > zone.order) {
                    zone.$element = $html.insertBefore($prevZone).data('order', zone.order);
                }
            }
        } else {
            zone.$element = $html.appendTo(zone.$container).data('order', zone.order);
        }
    };
    proto.loadZone = function (zone) {
        var self = this,
            doneFun = function (paper) {
                var data = paper.data, element = self.getZoneElement(paper.html),
                    $existZones = zone.$container.find('.hn-zone');
                zone.title = data.title;
                if (zone.title === undefined) {
                    zone.title = $('head>title').html();
                }
                zone.loaded = true;
                if ($('.hn-zone[data-name=' + zone.name + ']').length > 0) {//check again to make sure no other request added zone.
                    return;
                }
                self.inisertZoneElement(element, zone);
            };
        var paper = stage.getCacheManager().fetch(zone.url);
        if (paper) {
            doneFun(paper);
            return $.Deferred().resolve();
        } else {
            return $.ajax({ type: 'GET', url: zone.url, data: { partial: 2/*, referer: location.href*/ } }).done(function (content) {
                var paper = self._paperParser.parse(content);
                stage.pushPaperToCache(zone.url, paper);
                doneFun(paper);
            });
        }
    };
    proto.setActiveZone = function (zone) {
        var oldZone = this._activeZone, $deferred;
        if (!this._combineZones) {
            var spinner = stage.getSpinner(), self = this,
                removeOtherZones = function(){
                    for(var i = 0, il = self._zones.length; i < il; i++){
                        var zone = self._zones[i];
                        if (zone.loaded){
                            zone.$element.remove();
                        }
                    }
                };
            if (!zone.loaded) {
                $deferred = spinner.watch([this.loadZone(zone)]).done(function () {
                    removeOtherZones();
                });
                spinner.commit();
            } else {
                removeOtherZones();
                zone.$container.append(zone.$element);
            }
        }else{
            if (oldZone){
                oldZone.$element.removeClass('active');
            }
        }
        zone.$element.addClass('active');
        this._activeZone = zone;
        return $deferred === undefined ? $.Deferred().resolve() : $deferred;
    };
    proto.gotoZone = function (zone) {
        if (this._combineZones) {
            var scrollTop = zone.$element.data('zone-top');
            if (scrollTop === undefined) {
                scrollTop = zone.$element.offset().top;
            }
            this.setActiveZone(zone);
            return stage.scrollPage({ top: scrollTop }, true);
        } else {
            var deferred = this.setActiveZone(zone);
            if (!deferred && (typeof deferred.done !== 'function')){
                console.error('zone setActiveZone must return an Deferred object');
            }else{
                return deferred;
            }
        }
    };
    proto.enter = function (paper) {
        var zone = this.findZoneByUrl(location.href);
        if (zone == null && this._zones.length > 0) {
            console.log('======do no find zone by url, use default.');
            zone = this._zones[0];
        }
        console.log('enter goto zone:', zone);
        if (zone) {
            return this.gotoZone(zone, 'enter');
        } 
        return $.Deferred().resolve();
    };
    proto.abort = function () {

    };
    proto.exit = function () {
        //console.warn('you must overwrite this method!');
        $('[data-scene-name=' + this.name +']').remove();
        this.dispose();
        return $.Deferred().resolve();
    };
    proto.layout = function () {

    };
    proto.dispose = function () {
        this._zones = null;
    };
    return Scheme;
});