define(['hance', 'jquery', 'crown/utils/UriComparer', 'crown/site/paper', 'crown/site/Curtain',
        'crown/ui/Spinner', 'crown/utils/CacheManager', 'crown/site/Zone', 'history'],
    function (hance, $, UriComparer, Paper, Curtain, Spinner, CacheManager) {
    var Scheme = hance.inherit("crown.site.Stage", function () { });
    Scheme.options = {uriComparer: new UriComparer(),
        paper: new Paper(),
        cacheManager: new CacheManager()};
    var proto = Scheme.prototype;
    hance.properties(proto, [{ name: 'curtain', getter: true, setter: true },
        { name: 'scene', getter: true, setter: false },
        { name: 'spinner', getter: true, setter: true },
        { name: 'uriComparer', getter: true, setter: false },
        { name: 'cacheManager', getter: true, setter: false }]);
    proto.init = function (options) {
        this.$this = $(this);
        this.$window = $(window);
        this.$document = $(document);
        this.$html = $('html');
        this.$body = $(document.body);
        this.options = $.extend({}, Scheme.options, options);
        this.cache = { window: { width: -1, height: -1 }, document: { width: -1, height: -1 } };
        this._cacheManager = this.options.cacheManager;
        this._cacheScenes = this.options.cacheScenes;
        this._initialPageTitle = $('head>title').html();
        this._uriComparer = this.options.uriComparer;
        this._spinner = this.options.spinner;

        window.stage = this;

        this.currentUrl = location.href;
        this.setupLinks();

        this.processResize();
    };
    proto.pushPageToCache = function (url, paper) {
        if (this._cacheScenes === true ||
            ($.isArray(this._cacheScenes) && this._cacheScenes.indexOf(paper.data.scene.name) >= 0)){
            this._cacheManager.push(url, paper);
        }
    };
    proto.getInitialPageTitle = function(){
        return this._initialPageTitle;
    };
    proto.getZoneScriptPath = function(name){
        return Uri.combine(metadata.scriptBase, name);
    };
    proto.processResize = function () {
        this.$window.on('resize', function () {
            stage.isResizing = true;
        });

        var resizeHandler = function () {
            var $doc = stage.$document,
                $win = stage.$window,
                cdoc = stage.cache.document,
                cwin = stage.cache.window,
                docw = $doc.width(),
                doch = $doc.height(),
                winw = $win.width(),
                winh = $win.height();
            if (stage.isResizing || cwin.width <= 0 || cwin.height <= 0) {
                cwin.width = winw;
                cwin.height = winh;
                if (stage.resize) {
                    stage.resize(cwin, cdoc);
                }
            }
            stage.isResizing = false;
            if (docw !== cdoc.width || doch !== cdoc.height) {
                cdoc.width = docw;
                cdoc.height = doch;
                if (stage.layout) {
                    stage.layout(cwin, cdoc);
                }
            }
        };
        this.resizeIntervalId = setInterval(resizeHandler, 100);
        resizeHandler();
    };
    proto.linkClickHandler = function (target, event) {
        var $element = $(target), href = $element.attr('href') || $element.data('href');
        if (this._scene) {
            var zone = this._scene.findZoneByUrl(href);
            if (zone) {
                    History.pushState({ event: 'click', actions: ['zone'] }, zone.title, zone.url);
                    return false;
            }
        }
        if (!this._uriComparer.isUrlEqual(href, this.currentUrl)) {
                History.pushState({ event: 'click', actions: ['scene'] }, $('head>title').html(), href);
        }
        return false;
    };
    proto.addressHandler = function (target, event) {
        this.updateLinks(event.newUrl);
    };
    //update active zone chain, after url changed and new zones entered, update active zone chain,
    // it will be an array, it contains all zones name which has 'active' class.
    proto.updateActiveZoneChain = function(){

    };
    proto.setupLinks = function () {
        var self = this;
        this.$document.on('click.stage', '.hn-zone-link', function (e) {
            return self.linkClickHandler(this, e);
        });
        this.$this.on('address.stage', function (e) {
            return self.addressHandler(this, e);
        });
    };
    proto.updateLinks = function (url) {
        var url = url || this.currentUrl;
        //console.log('=======update link,', url)
        $('.hn-zone-link').each(function () {
            var $this = $(this),
                zoneName = $this.attr('cw-zone-name'),
                href = $this.attr('href') || $this.data('href'),
                compareValue = stage._uriComparer.compareUrl(href, url);
            if ($this.hasClass('cw-zone-link')) {
                if ($item.length > 0) {
                    $item.toggleClass('active', compareValue === 0);
                } else {
                    $this.toggleClass('active', compareValue === 0);
                }
            } else {
                if ($item.length > 0) {
                    $item.toggleClass('active', compareValue === 0 || compareValue === -1);
                } else {
                    $this.toggleClass('active', compareValue === 0 || compareValue === -1);
                }
            }
        });
    };
    proto.getZones = function () {
        return this._zones;
    };
    proto.findZoneByName = function (zoneName) {
        for (var i = 0, il = this._zones.length; i < il; i++) {
            var zone = this._zones[i];
            if (zone.name === zoneName) {
                return zone;
            }
        }
    };
    proto.handleStateChange = function (e) {
        var state = History.getState(),
            data = state.data,
            newUrl = state.url;
        console.log('=====================stage change: ', e, data);
        $.extend(data, { oldUrl: this.currentUrl, newUrl: newUrl });
        this.$this.trigger($.Event('address', { state: state, oldUrl: this.currentUrl, newUrl: newUrl }));
        if (data.actions) {
            for (var i = 0, il = data.actions.length; i < il; i++) {
                var action = data.actions[i];
                if (this['state_action_' + action]) {
                    this['state_action_' + action](state);
                }
            }
        }
        this.currentUrl = newUrl;
    };
    proto.state_action_zone = function (state) {
        var url = state.url,
            doneFun = function ($html) {
                var $newZones = $html.find('.cw-zone');
                require([paper.data.scene.script], function (Scene) {
                    var scene = new Scene(),
                        oldScene = self._scene;
                    if (paper.data && paper.data.scene && paper.data.scene.name !== undefined){
                        scene.name = paper.data.scene.name;
                    }
                    stage._scene = scene;
                    stage.$document.attr('title', paper.data.title);
                    stage.getCurtain().shift();
                });
            };
        var html = this._cacheManager.fetch(state.url);
        if (paper) {
            doneFun(html);
        } else {
            var deferred = $.ajax({ type: 'GET', url: url, data: { partial: 1/*, referer: state.oldUrl*/ } }).done(function(content){
                stage.pushPageToCache(url, $('<html />').html(content));
                doneFun(html);
            });
            this.getSpinner().watch([deferred]);
        }
    };
    proto.getCWAttr = function($element, attrName){
        var attrs = $element.attr(), attrValue = attrs['cw-' + attrName];
        if (attrValue !== undefined){
            return attrValue;
        }
        attrValue = attrs['data-cw-'+attrName];
        if (attrValue !== undefined){
            return attrValue;
        }
    };
    proto.hasCWProp = function($element, propName){
        return $element.prop('cw-' + propName) || $element.hasClass('cw-' + propName);
    };
    proto.getCurtain = function () {
        if (this._curtain === undefined) {
            this._curtain = new Curtain();
        }
        return this._curtain;
    };
    proto.getSpinner = function () {
        if (this._spinner === undefined) {
            this._spinner = new Spinner();
        }
        return this._spinner;
    };
    return Scheme;
});
