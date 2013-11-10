define(['jquery', 'crown', 'crown.site/Stage', 'crown.ui/Spinner', 'crown.ui/Picture', 'crown.utils/UriComparer', 'crown.browser', 'modernizr', 'prettify'
], function ($, crown, Stage, Spinner, Picture, UriComparer, browser) {
    //UriComparer.options.ingnoreAnchor = false;
    var Scheme = crown.inherit("SiteStage", Stage);
    Scheme.options = { features: {} };
    var proto = Scheme.prototype;
    proto.init = function () {
        this._viewSizes = [{ name: 'wide', width: 1200, height: 720 },
            { name: 'normal', width: 1000, height: 625 }];
        for (var i = 0, il = this._viewSizes.length; i < il; i++) {
            var size = this._viewSizes[i];
            if (size.width <= screen.availWidth && size.height <= screen.availHeight) {
                this.setViewSize(size);
                break;
            }
        }
        var self = this;
        this.$torso = $('#torso');
        this.$wrapper = $('#wrapper');
        if ((browser.msie && browser.version < 11) || browser.ipad || browser.android || browser.iphone) {
            Picture.options.renderMode = 'img';
        }
        Scheme.uber.init.call(this, {
            spinner: new Spinner(null),
            cacheScenes: true,
            enableHistory: Modernizr.history && !(browser.ipad || browser.android || browser.iphone)
        });
        //History.Adapter.bind(window, 'anchorchange', function (e) {
        //    console.log('===========ahs change')
        //    self.handleStateChange(e);
        //});
        this.enableTouch = !browser.msie || (browser.msie && browser.version >= 9);
        this.resolution = screen.availWidth > 960 ? 'large' : 'small';
        this.$document.on('keydown', $.proxy(this.keyDownHandler, this));
        //this.$window.on('webkitfullscreenchange mozfullscreenchange', $.proxy(this.fullScreenHandler, this));
        prettyPrint();
    };
    proto.setViewSize = function (size) {
        this._viewSize = size;
        $('html').attr('data-view-size', this._viewSize.name);
    };
    proto.resize = function (wind, docd) {
        if (this._scene) {
            this._scene.layout();
        }
    };
    proto.layout = function (wind, docd) {
        //if (this.scene) {
        //    this.scene.layout();
        //}
    };
    proto.nextSlide = function () {
        var zones = this._scene._zones,
            activeZone = this._scene.getActiveZone(),
            $buildItem = activeZone.$element.find('.build-item:not(.built,.current):first');
        if ($buildItem.length > 0) {
            activeZone.$element.find('.build-item.current').removeClass('current').addClass('built');
            $buildItem.addClass('current');
            return;
        }
        activeZone.$element.find('.build-item.current').removeClass('current').addClass('built');
        var index = zones.indexOf(activeZone);
        if (activeZone && index < zones.length - 1) {
            var zone = zones[index + 1];
            History.pushState({ event: 'click', actions: ['zone'] }, zone.title, zone.url);
        }
    };
    proto.prevSlide = function () {
        var zones = this._scene._zones,
            activeZone = this._scene.getActiveZone();
        var index = zones.indexOf(activeZone);
        if (activeZone && index > 0) {
            var zone = zones[index - 1];
            History.pushState({ event: 'click', actions: ['zone'] }, zone.title, zone.url);
        }
    };
    proto.keyDownHandler = function (e) {
        if (/^(input|textarea)$/i.test(e.target.nodeName) ||
            e.target.isContentEditable) {
            return;
        }
        switch (e.keyCode) {
            case 39: // right arrow
            case 32: // space
            case 34: // PgDn
            case 40: // down arrow
                this.nextSlide();
                e.preventDefault();
                break;

            case 37: // left arrow
            case 8: // Backspace
            case 33: // PgUp
            case 38: // up arrow
                this.prevSlide();
                e.preventDefault();
                break;

            case 72: // H: Toggle code highlighting
                document.body.classList.toggle('highlight-code');
                break;

            case 80: // P
                document.body.classList.toggle('with-notes');
                break;

            case 27: // ESC:
            case 70: // F: Toggle fullscreen
                // Only respect 'f' on body. Don't want to capture keys from an <input>.
                // Also, ignore browser's fullscreen shortcut (cmd+shift+f) so we don't
                // get trapped in fullscreen!
                //console.log(document.mozFullScreen)
                if (e.target === document.body && !(e.shiftKey && e.metaKey)) {
                    if (document.mozFullScreen !== undefined && !document.mozFullScreen) {
                        document.body.mozRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
                        $('html').addClass('fullscreen');
                        this.fitWrapperToScreen(true);
                    } else if (document.webkitIsFullScreen !== undefined && !document.webkitIsFullScreen) {
                        document.body.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
                        $('html').addClass('fullscreen');
                        this.fitWrapperToScreen(true);
                    } else {
                        $('html').removeClass('fullscreen');
                        document.cancelFullScreen();
                        this.$wrapper.css('transform', '');
                    }
                }
                break;

            case 83: // S: Toggle widescreen
                // Only respect 'w' on body. Don't want to capture keys from an <input>.
                if (e.target === document.body && !(e.shiftKey && e.metaKey)) {
                    var index = (this._viewSizes.indexOf(this._viewSize) + 1) % this._viewSizes.length;
                    this.setViewSize(this._viewSizes[index]);
                    this.fitWrapperToScreen();
                }
                break;
        }
    };
    //proto.fullScreenHandler = function(e){
    //};
    proto.fitWrapperToScreen = function (force) {
        if (document.webkitIsFullScreen || document.mozFullScreen || force) {
            var viewWidth = this._viewSize.width,
                viewHeight = this._viewSize.height,
                screenWidth = screen.availWidth,
                screenHeight = screen.availHeight,
                scale = Math.min(screenWidth / viewWidth, screenHeight / viewHeight);
            this.$wrapper.css('transform', 'scale(' + scale + ')');
        }
    };
    proto.combinePath = function () {
        var args = Array.prototype.slice.apply(arguments), path = '';
        for (var i = 0, il = args.length; i < il; i++) {
            if (path !== '' && path[path.length - 1] !=='/') {
                path += '/';
            }
            var part = args[i];
            if (part && part[0] === '/' && i > 0) {
                path += part.substring(1);
            } else {
                path += part;
            }
        }
        return path;
    };
    return Scheme;
});
