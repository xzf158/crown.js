define(['hance', 'jquery', 'crown/utils/Uri', 'hammer', 'history', 'crown/shim/animation'], function (hance, $, Uri) {
    var Scheme = hance.inherit("crown.site.Scene", function () { }),
        proto = Scheme.prototype;
    Scheme.options = {combineZones:true, zones:null};
    hance.properties(proto, [{ name: 'name', getter: true, setter: true }]);
    proto.init = function ($node, options) {
        this.options = $.extend({}, Scheme.options, options);
        this._name = this.options.name;
        this._layer = this.options.layer;
        this._order = this.options.order;
        this._cached = this.options.cached;
        this._routed = this.options.routed;
        this._parentNode = this.options.parentNode;
        this.$node = $node;
    };
    proto.load = function () {
        return $.Deferred().resolve();
    };
    proto.ensureElementInDom = function(){
        if (stage.$document.find(this.$node).length > 0){
            return;
        }
        var $parent = stage.findZoneNodeParentInDom(this.$node);
        if ($parent.length > 0){
            var $children = $parent.children(), inserted = false;
            for(var i = 0, il = $children.length; i < il; i++){
                var $child = $children.eq(i), 
                    order = parseInt($child.attr(stage._htmlDataNames.order));
                if ($child.hasClass(stage._htmlClassNames.zone) && order >= this._order){
                    this.$node.insertBefore($child);
                    inserted = true;
                    break;
                }
            }
            if (!inserted){
                this.$node.appendTo($parent);
            }
        }else{
            console.warn('Can not find zone parent element from current dom!');
        }
    };
    proto.enter = function () {
        console.log('======enter');
        this.ensureElementInDom();
        return $.Deferred().resolve();
    };
    proto.sync = function($node){

    };
    proto.active = function(){

    };
    proto.abort = function () {

    };
    proto.exit = function () {
        console.log('exiting');
        this.$node.remove();
        this.dispose();
        return $.Deferred().resolve();
    };
    proto.layout = function () {
        for(var i = 0, il = this._childZones.length; i < il; i++){
            this._childZones.layout();
        }
    };
    proto.dispose = function () {
        this._zones = null;
    };
    proto.getZoneElement = function (html) {
        return html[0].node;
    };
    proto.inisertZoneNode = function (html, zone) {
        var $existZones = zone.$container.find('.hn-zone'), $html = $(html);
        if ($existZones.length > 0) {
            for (var i = 0, il = $existZones.length; i < il; i++) {
                var $prevZone = $existZones.eq(i),
                    $nextZone = (i === il - 1 ? null : $existZones.eq(i + 1));
                if ($prevZone.data('order') <= zone.order && ($nextZone == null || $nextZone.data('order') >= zone.order)) {
                    zone.$node = $html.insertAfter($prevZone).data('order', zone.order);
                } else if (i === 0 && $prevZone.data('order') > zone.order) {
                    zone.$node = $html.insertBefore($prevZone).data('order', zone.order);
                }
            }
        } else {
            zone.$node = $html.appendTo(zone.$container).data('order', zone.order);
        }
    };
    proto.loadZone = function (zone) {
        var self = this,
            doneFun = function (paper) {
                var data = paper.data, node = self.getZoneElement(paper.html),
                    $existZones = zone.$container.find('.hn-zone');
                zone.title = data.title;
                if (zone.title === undefined) {
                    zone.title = $('head>title').html();
                }
                zone.loaded = true;
                if ($('.hn-zone[data-name=' + zone.name + ']').length > 0) {//check again to make sure no other request added zone.
                    return;
                }
                self.inisertZoneNode(node, zone);
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
                            zone.$node.remove();
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
                zone.$container.append(zone.$node);
            }
        }else{
            if (oldZone){
                oldZone.$node.removeClass('active');
            }
        }
        zone.$node.addClass('active');
        this._activeZone = zone;
        return $deferred === undefined ? $.Deferred().resolve() : $deferred;
    };
    proto.gotoZone = function (zone) {
        if (this._combineZones) {
            var scrollTop = zone.$node.data('zone-top');
            if (scrollTop === undefined) {
                scrollTop = zone.$node.offset().top;
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
    return Scheme;
});