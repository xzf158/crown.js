define(['hance', 'jquery', 'crown/utils/UriComparer', 'crown/site/paper', 'crown/site/Curtain',
        'crown/ui/Spinner', 'crown/utils/CacheManager', 'crown/site/Zone', 'history'],
    function (hance, $, UriComparer, Paper, Curtain, Spinner, CacheManager) {
    var Scheme = hance.inherit("crown.site.Stage", function () { });
    Scheme.options = {uriComparer: new UriComparer(),
        paper: new Paper(),
        cacheManager: new CacheManager(),
        classPrefix:'cw-',
        attrPrefix:'cw-',
        propPrefix:'cw-'
        };
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

        this._classPrefix='cw-';
        this._dataPrefix='cw-';
        this._htmlClassNames = {
            zone:this._classPrefix + 'zone',
            active:this._classPrefix + 'active',
            zoneLink:this._classPrefix + 'zone-link',
            clicked:this._classPrefix + 'clicked'
        };
        this._htmlDataNames = {
            name:this._dataPrefix + 'name',
            layer:this._dataPrefix + 'layer',
            routed:this._dataPrefix + 'routed',
            zoneName:this._dataPrefix + 'zone-name'
        };

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
        var $element = $(target),
            href = $element.attr('href') || $element.data('href') || $element.find('a').attr('href');
        $('.'+ this._htmlClassNames.zoneLink).each(function(){
            $(this).toggleClass(this._htmlClassNames.clicked, this === target);
        });
        History.pushState({ event: 'click', actions: ['zone'] }, '', href);//TODO
        return false;
    };
    proto.addressHandler = function (target, event) {
        this.updateLinks(event.newUrl);
    };
    proto.updateActiveZones = function(){
        $('.' + this._htmlClassNames.zone).each(function(){
            var $this = $(this);
            $this.toggleClass(this._htmlClassNames.active, $this.prop(this._htmlDataNames.routed) || $this.has(':' + this._htmlDataNames.routed));
        });
    };
    proto.setupLinks = function () {
        this.$document.on('click.stage', '.' + this._htmlClassNames.zoneLink, function (e) {
            return self.linkClickHandler(this, e);
        });
    };
    proto.updateLinks = function (url) {
        var url = url || this.currentUrl;
        //console.log('=======update link,', url)
        $('.' + this._htmlClassNames.zoneLink).each(function () {
            var $this = $(this),
                zoneName = $this.attr(stage._htmlDataNames.zoneName);
            $this.toggleClass(stage._htmlClassName.active,
                $('.' + this._htmlClassNames.zone + '[' + this._htmlDataNames.routed + '][' + this._htmlDataNames.name + '=' + $this.attr(this._htmlDataNames.zoneName) + ']'));
        });
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
