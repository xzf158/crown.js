define(['hance', 'jquery', 'crown/utils/UriComparer', 'crown/site/PaperParser', 'crown/site/Curtain',
        'crown/ui/Spinner', 'utils/CacheManager', 'crown/site/Zone', 'history'],
    function (hance, $, UriComparer, PaperParser, Curtain, Spinner, CacheManager) {
    var Scheme = hance.inherit("crown.site.Stage", function () { });
    Scheme.options = {uriComparer: new UriComparer(), 
        paperParser: new PaperParser(), 
        cacheManager: new CacheManager(),
        cacheScenes:false,
        enableHistory:true};
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
        this._paperParser = this.options.paperParser;
        this._spinner = this.options.spinner;
        this._enableHistory = this.options.enableHistory;

        window.stage = this;

        this.currentUrl = location.href;
        this.setupLinks();

        this.processResize();
        var paper = this._paperParser.parse(document), self = this;
        this.pushPaperToCache(this.currentUrl, paper);
        require([paper.data.scene.script], function (Scene) {
            self._scene = new Scene();
            History.replaceState({ event: 'init', actions: ['scene'] }, self._initialPageTitle, location.href);
            self._initHistoryState = History.getState();
            if (paper.data && paper.data.scene && paper.data.scene.name !== undefined){
                self._scene.name = paper.data.scene.name;
            }
            self._scene.load().done(function () {
                self._scene.enter().done(function () {
                    History.Adapter.bind(window, 'statechange', function (e) {
                        self.handleStateChange(e);
                    });
                });
            });
        });
    };
    proto.pushPaperToCache = function (url, paper) {
        if (this._cacheScenes === true || 
            ($.isArray(this._cacheScenes) && this._cacheScenes.indexOf(paper.data.scene.name) >= 0)){
            this._cacheManager.push(url, paper);
        }
    };
    proto.getInitialPageTitle = function(){
        return this._initialPageTitle;
    };
    proto.getZoneScript = function(name){
        return './scripts/zones/' + name;
    };
    proto.processResize = function () {
        var self = this;
        this.$window.on('resize', function () {
            self.isResizing = true;
        });

        var resizeHandler = function () {
            var $doc = self.$document, $win = self.$window, cdoc = self.cache.document, cwin = self.cache.window, docw = $doc.width(), doch = $doc.height(), winw = $win.width(), winh = $win.height();
            if (self.isResizing || cwin.width <= 0 || cwin.height <= 0) {
                cwin.width = winw;
                cwin.height = winh;
                if (self.resize) {
                    self.resize(cwin, cdoc);
                }
            }
            self.isResizing = false;
            if (docw !== cdoc.width || doch !== cdoc.height) {
                cdoc.width = docw;
                cdoc.height = doch;
                if (self.layout) {
                    self.layout(cwin, cdoc);
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
                if (this._enableHistory) {
                    History.pushState({ event: 'click', actions: ['zone'] }, zone.title, zone.url);
                    return false;
                } else {
                    if (this._scene._combineZones) {
                        this._scene.gotoZone(zone);
                        this.fakeStateChange(zone.url);
                        return false;
                    } else {
                        return true;
                    }
                }
            }
        }
        if (!this._uriComparer.isUrlEqual(href, this.currentUrl)) {
            if (this._enableHistory) {
                History.pushState({ event: 'click', actions: ['scene'] }, $('head>title').html(), href);
                return false;
            } else {
                this.fakeStateChange(href);
            }
        } else {
            return false;
        }
    };
    proto.addressHandler = function (target, event) {
        this.updateLinks(event.newUrl);
    };
    proto.setupLinks = function () {
        var self = this;
        this.$document.on('click.stage', '.hn-scene-link,.hn-zone-link', function (e) {
            return self.linkClickHandler(this, e);
        });
        this.$this.on('address.stage', function (e) {
            return self.addressHandler(this, e);
        });
    };
    proto.updateLinks = function (url) {
        var self = this, url = url || this.currentUrl;
        //console.log('=======update link,', url)
        $('.hn-zone-link').each(function () {
            var $this = $(this),
                $item = $this.closest('.cw-navi-item'),
                zoneName = $this.attr('cw-zone-name'),
                href = $this.attr('href') || $this.data('href'),
                compareValue = self._uriComparer.compareUrl(href, url);
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
    proto.findZoneByUrl = function (url) {
        for (var i = 0, il = this._zones.length; i < il; i++) {
            var zone = this._zones[i];
            //console.log(zone.url, url)
            if (stage.getUriComparer().isUrlEqual(zone.url, url)) {
                return zone;
            }
        }
    };
    proto.fakeStateChange = function (newUrl) {
        this.$this.trigger($.Event('address', { state: History.getState(), oldUrl: this.currentUrl, newUrl: newUrl }));
        this.currentUrl = newUrl;
    };
    proto.handleStateChange = function (e) {
        var state = History.getState(), data = state.data, newUrl = state.url;
        console.log('=====================satege change: ', e, data);
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
        var self = this, 
            url = state.url, 
            doneFun = function (paper) {
                if (paper.data.scene.name === self._scene.name){
                    self.state_action_zone(state);
                    return;
                }
                self._scene.abort();
                require([paper.data.scene.script], function (Scene) {
                    var scene = new Scene(), 
                        oldScene = self._scene;
                    if (paper.data && paper.data.scene && paper.data.scene.name !== undefined){
                        scene.name = paper.data.scene.name;
                    }
                    self._scene = scene;
                    self.$document.attr('title', paper.data.title);
                    scene.load(paper).done(function () {
                        self.getCurtain().shift(paper, oldScene, scene, state);
                    });
                });
            };
        var paper = this._cacheManager.fetch(state.url);
        if (paper) {
            doneFun(paper);
        } else {
            var deferred = $.ajax({ type: 'GET', url: url, data: { partial: 1/*, referer: state.oldUrl*/ } }).done(function(content){
                var paper = self._paperParser.parse(content);
                self.pushPaperToCache(url, paper);
                doneFun(paper);
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