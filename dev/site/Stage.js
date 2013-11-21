define(['hance', 'jquery', 'crown/utils/Uri', 'crown/site/Zone', 'crown/site/Curtain',
        'crown/ui/Spinner', 'crown/utils/CacheManager', 'crown/site/Zone', 'history'
    ],
    function(hance, $, Uri, Zone, Curtain, Spinner, CacheManager) {
        var Scheme = hance.inherit("crown.site.Stage", function() {});
        Scheme.options = {
            cacheManager: new CacheManager(),
            classPrefix: 'cw-',
            attrPrefix: 'cw-'
        };
        var proto = Scheme.prototype;
        hance.properties(proto, [{
            name: 'curtain',
            getter: true,
            setter: true
        }, {
            name: 'scene',
            getter: true,
            setter: false
        }, {
            name: 'spinner',
            getter: true,
            setter: true
        }, {
            name: 'uriComparer',
            getter: true,
            setter: false
        }, {
            name: 'cacheManager',
            getter: true,
            setter: false
        }]);
        proto.init = function(options) {
            this.$this = $(this);
            this.$window = $(window);
            this.$document = $(document);
            this.$html = $('html');
            this.$body = $(document.body);
            this.options = $.extend({}, Scheme.options, options);
            this.cache = {
                window: {
                    width: -1,
                    height: -1
                },
                document: {
                    width: -1,
                    height: -1
                }
            };
            this._cacheManager = this.options.cacheManager;
            this._cacheScenes = this.options.cacheScenes;
            this._initialPageTitle = $('head>title').html();
            this._uriComparer = this.options.uriComparer;
            this._spinner = this.options.spinner;

            this._classPrefix = 'cw-';
            this._dataPrefix = 'cw-';
            this._htmlClassNames = {
                zone: this._classPrefix + 'zone',
                actived: this._classPrefix + 'actived',
                zoneLink: this._classPrefix + 'zone-link',
                clicked: this._classPrefix + 'clicked'
            };
            this._htmlDataNames = {
                name: this._dataPrefix + 'name',
                layer: this._dataPrefix + 'layer',
                routed: this._dataPrefix + 'routed',
                cached: this._dataPrefix + 'cached',
                zoneName: this._dataPrefix + 'zone-name'
            };
            this._allZones = [];

            window.stage = this;

            this.currentUrl = location.href;
            this.setupLinks();

            this.afterHtmlLoaded(this.$document);
            History.Adapter.bind(window, 'statechange', function(e) {
                stage.handleStateChange(e);
            });

            this.processResize();
        };
        proto.pushPageToCache = function(url, paper) {
            if (this._cacheScenes === true ||
                ($.isArray(this._cacheScenes) && this._cacheScenes.indexOf(paper.data.scene.name) >= 0)) {
                this._cacheManager.push(url, paper);
            }
        };
        proto.getInitialPageTitle = function() {
            return this._initialPageTitle;
        };
        proto.getZoneScriptPath = function(name) {
            return Uri.combine(window.metadata.scriptBase, name);
        };
        proto.processResize = function() {
            this.$window.on('resize', function() {
                stage.isResizing = true;
            });

            var resizeHandler = function() {
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
        proto.linkClickHandler = function(target, event) {
            var $element = $(target),
                href = $element.attr('href') || $element.data('href') || $element.find('a').attr('href'),
                zoneName = $element.attr(this._htmlDataNames.zoneName),
                existZone = this.findZone(zoneName);
            if (existZone) {
                existZone.active();
                $('.' + this._htmlClassNames.zoneLink).each(function() {
                    $(this).toggleClass(stage._htmlClassNames.actived, this === target);
                });
                return false;
            } else {
                $('.' + this._htmlClassNames.zoneLink).each(function() {
                    $(this).toggleClass(stage._htmlClassNames.clicked, this === target);
                });
                History.pushState({
                    event: 'click',
                    actions: ['zone']
                }, '', href); //TODO
            }
            return false;
        };
        proto.addressHandler = function(target, event) {
            this.updateLinks(event.newUrl);
        };
        proto.updateActiveZones = function() {
            $('.' + this._htmlClassNames.zone).each(function() {
                var $this = $(this);
                $this.toggleClass(this._htmlClassNames.actived, $this.attr(this._htmlDataNames.routed) || $this.has(':' + this._htmlDataNames.routed));
            });
        };
        proto.setupLinks = function() {
            this.$document.on('click.stage', '.' + this._htmlClassNames.zoneLink, function(e) {
                return stage.linkClickHandler(this, e);
            });
        };
        proto.updateLinks = function(url) {
            var url = url || this.currentUrl;
            //console.log('=======update link,', url)
            $('.' + this._htmlClassNames.zoneLink).each(function() {
                var $this = $(this),
                    zoneName = $this.attr(stage._htmlDataNames.zoneName);
                $this.toggleClass(stage._htmlClassName.active,
                    $('.' + this._htmlClassNames.zone + '[' + this._htmlDataNames.routed + '][' + this._htmlDataNames.name + '=' + $this.attr(this._htmlDataNames.zoneName) + ']'));
            });
        };
        proto.handleStateChange = function(e) {
            var state = History.getState(),
                data = state.data,
                newUrl = state.url;
            console.log('=====================stage change: ', e, data);
            $.extend(data, {
                oldUrl: this.currentUrl,
                newUrl: newUrl
            });
            this.$this.trigger($.Event('address', {
                state: state,
                oldUrl: this.currentUrl,
                newUrl: newUrl
            }));
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
        proto.getZoneData = function($element) {
            var eleData = $element.data(),
                zoneData = {
                    name: eleData[stage._htmlDataNames.name],
                    type: eleData[stage._htmlDataNames.type],
                    script: eleData[stage._htmlDataNames.script],
                    routed: eleData[stage._htmlDataNames.routed],
                    cached: eleData[stage._htmlDataNames.cached],
                    layer: eleData[stage._htmlDataNames.layer] || 0
                };
            if (zoneData.script != null) {
                delete zoneData.type;
            } else {
                if (zoneData.type != null) {
                    zoneData.script = Uri.combine(window.metadata.baseUrl, 'scripts/zones/' + zoneData.type);
                } else {
                    zoneData.instance = new Zone($element, zoneData);
                }
            }
            return zoneData;
        };
        proto.afterHtmlLoaded = function($html) {
            var curtain = stage.getCurtain(),
                spinner = this.getSpinner(),
                loadZone = function(info) {
                    var $deferred = $.Deferred();
                    if (info.data.cached){
                        var zone = stage._cacheManager.fetch('zone|' + info.data.script);
                        if (zone){
                            curtain.push(zone, 'enter');
                            stage._allZones.push(zone);
                            return $deferred.resolve();
                        }
                    }
                    require([info.data.script], function(Zone) {
                        var zone = new Zone(info.data);
                        curtain.push(zone, 'enter');
                        stage._allZones.push(zone);
                        if (info.data.cached){
                            stage._cacheManager.push('zone|' + info.data.script, zone);
                        }
                        $deferred.when(zone.load(spinner)).resolve();
                    });
                    return $deferred.promise();
                },
                $newZones = $html.find('.' + stage._htmlClassNames.zone),
                loadInfos = [];
            $newZones.each(function() {
                var $this = $(this),
                    thisData = stage.getZoneData($this),
                    existZone = stage.findZone(thisData.name);
                if (existZone && thisData.layer !== existZone.layer) {
                    existZone.sync($this);
                    existZone.attr(stage._htmlDataNames.routed, thisData.routed);
                } else {
                    curtain.push(existZone, 'exit');
                    stage._allZones.splice(stage._allZones.indexOf(existZone), 1);
                }
                if (thisData.instance == null) {
                    loadInfos.push({
                        data: thisData,
                        $element: $this
                    });
                } else {
                    curtain.push(thisData.instance, 'enter');
                }
            });
            if (loadInfos.length === 0) {
                return $.Deferred().resolve();
            }
            var dfs = [];
            for (var i = 0, il = loadInfos.length; i < il; i++) {
                dfs.push(loadZone(loadInfos[i]));
            }
            stage.$document.attr('title', $html.find('title').html());
            var $deferred = $.Deferred().when.apply(null, dfs);
            return $deferred;
        };
        proto.state_action_zone = function(state) {
            var url = state.url,
                curtain = stage.getCurtain(),
                spinner = stage.getSpinner();
            var $html = this._cacheManager.fetch(state.url);
            curtain.clean();
            if ($html) {
                spinner.watch([this.afterHtmlLoaded($html)]);
                spinner.commit().done(function() {
                    curtain.shift();
                });
            } else {
                var $deferred = $.ajax({
                    type: 'GET',
                    url: url,
                    data: {
                        partial: 1 /*, referer: state.oldUrl*/
                    }
                }).done(function(content) {
                    $html = $('<html />').html(content);
                    stage._cacheManager.push(url, $html);
                    spinner.watch([stage.afterHtmlLoaded($html)]);
                    spinner.commit().done(function() {
                        curtain.shift();
                    });
                });
                spinner.watch([$deferred]);
            }
        };
        proto.findZone = function(name){
            for(var i = 0, il = this._allZones.length; i < il; i++){
                var zone = this._allZones[i];
                if (zone.getName() === name){
                    return zone;
                }
            }
        };
        proto.getCurtain = function() {
            if (this._curtain === undefined) {
                this._curtain = new Curtain();
            }
            return this._curtain;
        };
        proto.getSpinner = function() {
            if (this._spinner === undefined) {
                this._spinner = new Spinner();
            }
            return this._spinner;
        };
        return Scheme;
    });
