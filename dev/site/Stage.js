define(['crown', 'jquery', 'crown.utils/UriComparer', 'crown.site/PaperParser', 'crown.site/Curtain', 
        'crown.ui/Spinner', 'crown.site/CacheManager', 'crown.site/Scene', 'history', 
        'greensock/TweenMax', 'greensock/plugins/ScrollToPlugin', 'crown.shim/animation'
    ], function (crown, $, UriComparer, PaperParser, Curtain, Spinner, CacheManager) {
    var Scheme = crown.inherit("crown.site.Stage", function () { });
    Scheme.options = {uriComparer: new UriComparer(), 
        paperParser: new PaperParser(), 
        cacheManager: new CacheManager(),
        cacheScenes:false,
        enableHistory:true,
        enableScroll:false};
    var proto = Scheme.prototype;
    crown.properties(proto, [{ name: 'curtain', getter: true, setter: true },
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
        this._scrollTop = 0;
        this._initialPageTitle = $('head>title').html();
        this._uriComparer = this.options.uriComparer;
        this._paperParser = this.options.paperParser;
        this._spinner = this.options.spinner;
        this._enableHistory = this.options.enableHistory;
        this._enableScroll = this.options.enableScroll;

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
                    if (self._enableScroll){
                        self.processScroll();
                    }
                    History.Adapter.bind(window, 'statechange', function (e) {
                        self.handleStateChange(e);
                    });
                });
            });
        });

        //safari and chrome popsate first time and it will occupy scrolling page.
        self.stateAutoPoped = false;
        this.$window.one('popstate', function (e) {
            if (!e.originalEvent.state) {
                e.originalEvent.preventDefault();
                e.originalEvent.stopImmediatePropagation();
                e.originalEvent.stopPropagation();
                self.stateAutoPoped = true;
                //console.log('++++++====self._scrollTop:', self._scrollTop);
                self.$window.scrollTop(self._scrollTop);
                return false;
            }
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
    proto.processScroll = function () {
        var self = this, neverStopForAutoPoped = true;
        this.$window.on('scroll.stage', function (e) {
            if (self.stateAutoPoped && self.$window.scrollTop() !== self._scrollTop && neverStopForAutoPoped) {
                self.$window.scrollTop(self._scrollTop);
                neverStopForAutoPoped = false;
                return;
            }
            self.stateAutoPoped = false;
            self._scrollTop = self.$window.scrollTop();
            var zones = self._scene.getZones();
            for (var i in zones) {
                var zone = zones[i],
                    $element = zone.$element;
                if ($element && $element.length > 0) {
                    var eleOffset = $element.offset(),
                        eleHeight = $element.height(),
                        winScrollTop = self.$window.scrollTop(),
                        winHeight = self.cache.window.height;
                    if (eleOffset.top - winScrollTop - winHeight * 0.5 <= 0 && eleHeight + eleOffset.top - winScrollTop - winHeight * 0.5 >= 0) {
                        if (!self._uriComparer.isUrlEqual(zone.url, self.currentUrl)) {
                            if (self._enableHistory) {
                                History.pushState({ event: 'scroll' }, zone.title, zone.url);
                            } else {
                                self.fakeStateChange(zone.url);
                            }
                        }
                    }
                }
            }
        });
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
    proto.scrollPage = function (offset, preventStateChange, duration) {
        var deferred = $.Deferred(), self = this;
        if (preventStateChange) {
            this.$window.off('scroll.stage');
        }
        TweenMax.killTweensOf(window);
        duration = duration === undefined ? 0.5 : duration;
        TweenMax.to(window, duration, {scrollTo: { x: offset.left||0, y: offset.top||0 }, onComplete: function () {
                self.scrollingInfo = null;
                if (preventStateChange && self._enableScroll) {
                    self.processScroll();
                }
                self._scrollTop = self.$window.scrollTop();
                deferred.resolve();
            }
        });
        return deferred.promise();
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
        $('.hn-scene-link,.hn-zone-link').each(function () {
            var $this = $(this),
                $item = $this.closest('.hn-navi-item'),
                href = $this.attr('href') || $this.data('href'),
                compareValue = self._uriComparer.compareUrl(href, url);
            if ($this.hasClass('hn-zone-link')) {
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
        var url = state.url,
            zone = this._scene.findZoneByUrl(url);
        if (zone) {
            this._scene.gotoZone(zone);
            if (!this._enableHistory) {
                this.$document.attr('title', zone.title);
            }
        }
    };
    proto.state_action_scene = function (state) {
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