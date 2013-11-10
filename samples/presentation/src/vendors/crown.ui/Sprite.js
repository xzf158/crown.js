define(['jquery', 'crown', 'crown.ui/crown.ui.utils', 'crown.shim/animation'], function ($, crown, utils) {
    var Scheme = crown.inherit("crown.ui.Sprite", function () { });
    Scheme.options = { startFrame: 0, endFrame: -1, loops: 1, loopGap:0, interval: 24, renderMode: 'canvas', renderSequent: true, direction: 1 };
    Scheme.cssClassName = 'hn-sprite';
    Scheme.dataId = 'hn-sprite';
    Scheme._instances = [];
    Scheme._playlist = [];
    Scheme.sync = function () {
        $('.' + Scheme.cssClassName).each(function () {
            if (!Scheme.get(this)) {
                new Scheme(this);
            }
        });
    };
    Scheme.clean = function () {
        for (var i = Scheme._instances.length - 1; i >= 0; i--) {
            var instance = Scheme._instances[i];
            if (instance.useless()) {
                Scheme._instances.splice(i, 1);
                var index = Scheme._playlist.indexOf(instance);
                if (index >= 0) {
                    Scheme._playlist.splice(index, 1);
                }
                instance.dispose();
                instance = null;
            }
        }
        //console.log(">>>>>>>>>>>>>>>>>>>sprite clear called Scheme._instances.length: ", Scheme._instances.length, "   Scheme._playlist:", Scheme._playlist.length);
    };
    Scheme.get = function (element) {
        for (var i = 0, il = Scheme._instances.length; i < il; i++) {
            var instance = Scheme._instances[i];
            if (instance._element === element) {
                return instance;
            }
        }
        return null;
    };
    Scheme.remove = function (instance) {
        var index = Scheme._instances.indexOf(instance);
        if (index >= 0) {
            Scheme._instances.splice(index, 1);
        }
        index = Scheme._playlist.indexOf(instance);
        if (index >= 0) {
            Scheme._playlist.splice(index, 1);
        }
    };
    Scheme.update = function () {
        currentTime = new Date().getTime();
        //if (currentTime - lastTime > 16) {
           // lastTime = currentTime;
            for (var i = Scheme._playlist.length - 1; i >= 0; i--) {
                var sprite = Scheme._playlist[i];
                //if (sprite._textures[0].src.indexOf('plus-icon-texture') > 0)
                //    log.info("@@@@@callupdate: " + sprite._state + "   _texturesLoaded:" + sprite._texturesLoaded + "  maperlaod:" + sprite._mapperLoaded);
                if (sprite._state === 'playing' && currentTime - sprite._lastTime >= sprite._options.interval) {
                    sprite.update();
                    sprite._lastTime = currentTime;
                }
            }
        //}
        window.requestAnimationFrame(Scheme.update);
    };
    var currentTime = new Date().getTime(), lastTime = currentTime;
    Scheme.update();
    //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>sprite setup>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");

    var proto = Scheme.prototype;
    crown.properties(proto, [{ name: 'element', getter: true, setter: false },
    { name: 'options', getter: true, setter: false },
    { name: 'state', getter: true, setter: false },
    { name: 'loaded', getter: true, setter: false }]);
    proto._state = 'idle';
    proto.init = function (element, options) {
        var instance = Scheme.get(element);
        if (instance) {
            return instance;
        }
        Scheme._instances.push(this);

        this._element = element;
        this.build(options);
    };
    proto.build = function (options) {
        this._nextFrame = this._currentFrame = 0;
        var element = this._element;
        var options = this._options = $.extend({}, Scheme.options, $(element).data(), options);
        this._textureUrls = options.texture;
        if (typeof this._textureUrls === 'string') {
            this._textureUrls = [this._textureUrls];
        }
        this._mapperUrl = options.mapper;
        this._autoLoad = options.autoLoad;
        this._autoPlay = options.autoPlay;
        this._renderMode = options.renderMode;
        this._lastTime = new Date().getTime();
        //this.renderer = options.renderer;
        this._neverRender = true;

        this._textures = [];
        this._loadedTextureCount = 0;
        this._texturesLoaded = false;
        this._mapperLoaded = false;

        if (this._renderMode === 'canvas' && (Modernizr && !Modernizr.canvas)) {
            this._renderMode = 'div';
        }
        var $renderer = $(this._element).find('.hn-renderer');
        if (this._renderMode === 'div') {
            this._renderer = $renderer.length > 0 ? $renderer[0] : $('<div class="hn-renderer">').appendTo(element)[0];
        } else if (this._renderMode === 'canvas') {
            this._renderer = $renderer.length > 0 ? $renderer[0] : $('<canvas class="hn-renderer"></canvas>').appendTo(this._element)[0];
            //if (!this._renderer.getContext && G_vmlCanvasManager) {
            //    G_vmlCanvasManager.initElement(this._renderer);
            //}
            this._context = this._renderer.getContext('2d');
        }
        if (['absolute','relative'].indexOf($(element).css('position')) < 0) {
            $(element).css('position', 'relative');
        }

        if (options.spinner) {
            $(element).html('<div class="hn-spinner"><img src="' + this._options.spinner + '" alt="loading..." /></div>');
        }
        if (options.poster) {
            $(element).html('<div class="hn-poster"><img src="' + this._options.poster + '" alt="poster" /></div>');
        }
        if (this._autoLoad) {
            this.load(this._autoPlay);
        }
    };
    proto._textureLoadHandler = function (img) {
        if (this._disposed) {
            return;
        }
        this._loadedTextureCount++;
        if (this._loadedTextureCount >= this._textureUrls.length) {
            this._texturesLoaded = true;
            if (this.getLoaded()) {
                this.ready();
            }
        }
    };
    proto.load = function (autoPlay) {
        this._state = 'loading';
        var self = this, loadHandler = function () {
            //if (this.src.indexOf('plus-icon-texture') > 0)
            //    log.info(">>>>>>>>texture loaded url:" + this.src);
            self._textureLoadHandler.call(self, this);
        };
        this._autoPlay = autoPlay;
        for (var i = 0, il = this._textureUrls.length; i < il; i++) {
            //var texture = new Image();
            //texture.addEventListener('load', function () {
            //    self._loadedTextureCount++;
            //    if (self._loadedTextureCount >= self.textureUrls.length) {
            //        self._texturesLoaded = true;
            //        if (self.loaded()) {
            //            self.loadComplete();
            //        }
            //    }
            //}, false);
            //if (this._textureUrls[i].indexOf('plus-icon-texture') > 0)
            //    log.info("===========load imge url:" + this._textureUrls[i]);
            var texture = $('<img>').one('load', loadHandler).attr('src', this._textureUrls[i])[0];
            if (texture.complete && texture.readyState === 4) {
                //if (texture.src.indexOf('plus-icon-texture') > 0)
                //    log.info(">>>>>>>>texture from cache url:" + this.src);
                this._textureLoadHandler.call(this, texture);
            }
            this._textures.push(texture);
        }
        $.getJSON(this._mapperUrl).done(function (json) {
            //console.log(">>>>>>>>>>>get json>>>>>>:", self._mapperUrl);
            if (self._disposed) {
                return;
            }
            var index = self._mapperUrl.indexOf('#');
            if (index > 0 && index < self._mapperUrl.length - 1) {
                self._mapperName = self._mapperUrl.substring(index + 1);
                self._mapper = json[self._mapperName];
            } else {
                self._mapper = json;
            }
            self._mapperLoaded = true;
            if (self.getLoaded()) {
                self.ready();
            }
        });
    };
    proto.getLoaded = function () {
        return this._texturesLoaded && this._mapperLoaded;
    };
    proto.ready = function () {
        var json = this._mapper;
        this._mapper = [];
        this._stageWidth = json.stage.w;
        this._stageHeight = json.stage.h;
        for (var i = 0, il = json.frames.length; i < il; i++) {
            if ($.isArray(json.frames[i])) {
                for (var j = 0, jl = json.frames[i].length; j < jl; j++) {
                    var data = json.frames[i][j];
                    this._mapper.push($.extend({ texture: this._textures[i] }, data));
                }
            } else {
                var data = json.frames[i];
                this._mapper.push($.extend({ texture: this._textures[0] }, data));
            }
        }

        this.layoutRenderSize();

        this._totalFrames = this._mapper.length;
        this._currentFrame = 0;
        //if (this.element) {
        //    this.element.style.backgroundRepeat = 'no-repeat';
        //}
        this._state = 'loaded';
        $(this).trigger(this._state);

        $(this._element).find('.hn-poster').remove();

        if (this._autoPlay) {
            this.play(this._options);
        } else {
            this.render(0);
        }
    };
    proto.layoutRenderSize = function () {
        if (this._renderMode === 'canvas') {
            this._renderer.width = this._stageWidth;
            this._renderer.height = this._stageHeight;
        } else {
            $(this._renderer).css({ width: this._stageWidth, height: this._stageHeight });
        }
        $(this._renderer).attr({ 'data-stage-width': this._stageWidth, 'data-stage-height': this._stageHeight });
        //$(this._element).attr({ 'data-stage-width': this._stageWidth, 'data-stage-height': this._stageHeight });
    };
    proto.stop = function (options) {
        this._state = 'stopped';
        var index = Scheme._playlist.indexOf(this);
        if (index >= 0) {
            Scheme._playlist.splice(index, 1);
        }
    };
    proto.play = function (options) {
        if (options !== this._options) {//for auto play after load
            //this.options.direction = undefined;
            //this.options.delayPlay = undefined;
            //this.options.nextFrame = this.nextFrame;
            this._options = $.extend(this._options, options);
        }
        options = this._options;
        this._renderSequent = options.renderSequent;
        this._startFrame = options.startFrame;
        if (this._startFrame < 0) {
            this._startFrame = this._totalFrames - 1;
        }
        this._nextFrame = options.nextFrame;
        if (this._nextFrame === undefined || !this._renderSequent) {
            this._nextFrame = this._startFrame;
        }
        //if (window._bug_0) console.log("===============play===========nextFrame:", this._nextFrame, this.getLoaded());
        this._endFrame = options.endFrame;
        if (this._endFrame < 0) {
            this._endFrame = this._totalFrames - 1;
        }
        this._step = this._options.step;
        this._frontFrame = this._startFrame <= this._endFrame ? this._startFrame : this._endFrame;
        this._backFrame = this._startFrame >= this._endFrame ? this._startFrame : this._endFrame;
        this._currentLoop = 0;
        this._loops = options.loops;
        this._delayPlay = options.delayPlay;
        this._interval = options.interval;
        this._loopGap = options.loopGap;
        this._reversing = this._startFrame > this._endFrame;
        this._direction = options.direction === undefined ? (this._reversing ? -1 : 1) : options.direction;

        if (!this.getLoaded()) {
            if (this._state === 'loading') {
                this._autoPlay = true;
            } else {
                this.load(true);
            }
        } else {
            this._state = 'playing';
            if (Scheme._playlist.indexOf(this) < 0) {
                //if (this._textures[0].src.indexOf('plus-icon-texture') > 0)
                //    log.info("@@@@@push to list");
                //if (window._bug_0) console.log(">>>>>>>>>>>>>>.add to playlist");
                Scheme._playlist.push(this);
            }
        }
    };
    proto.update = function () {
        //if (this._textures[0].src.indexOf('plus-icon-texture') > 0)
        //    log.info("@@@@@update" + this.getLoaded());
        //if (window._bug_0) console.log(">>>>>this._currentFrame:", this._currentFrame);
        if (this._delayPlay > 0) {
            this._delayPlay -= this._interval;
            if (this._neverRender) {
                this.render(this._startFrame);
            }
            return;
        }

        if (this._direction === 1 && this._reversing || this._direction === -1 && !this._reversing) {
            this.render(this._startFrame);
            //if (window._bug_0) console.log("===========stop 0");
            this.stop();
            return;
        }
        if (this._frontFrame === this._backFrame) {//only 1 frame, bug: if current nextframe is not frontframe and backframe and want to frontframe smooth.fixed
            if (this._renderSequent && this._nextFrame !== this._startFrame) {
                this._nextFrame = this._nextFrame > this._startFrame ? this._nextFrame - 1 : this._nextFrame + 1;
                this.render(this._nextFrame);
            } else {
                this.render(this._startFrame);
                //if (window._bug_0) console.log("===========stop 1");
                this.stop();
            }
            return;
        }

        this._state = 'playing';

        this._currentFrame = this._nextFrame;
        this.render(this._currentFrame);
        if (!this._reversing) {
            var nextFrame = this._currentFrame + 1;
            if (nextFrame > this._backFrame) {
                if (++this._currentLoop >= this._loops && this._loops > 0) {
                    //if (window._bug_0) console.log("===========stop 2");
                    this.stop();
                    return;
                } else {
                    if (this._direction <= 0) {
                        this._reversing = true;
                        this._nextFrame = this._backFrame - 1;
                    } else {
                        this._nextFrame = this._frontFrame;
                    }
                    if (this._loopGap > 0) {
                        this._delayPlay = this._loopGap;
                    }
                }
            } else {
                this._nextFrame = nextFrame;
            }
        } else {
            var nextFrame = this._currentFrame - 1;
            if (nextFrame < this._frontFrame) {
                if (++this._currentLoop >= this._loops && this._loops > 0) {
                    //if (window._bug_0) console.log("===========stop 3");
                    this.stop();
                    return;
                }
                if (this._direction >= 0) {
                    this._reversing = false;
                    this._nextFrame = this._frontFrame + 1;
                } else {
                    this._nextFrame = this._backFrame;
                }
                if (this._loopGap > 0) {
                    this._delayPlay = this._loopGap;
                }
            } else {
                this._nextFrame = nextFrame;
            }
        }
    };
    proto.pause = function () {
        this._state = 'puased';
    };
    proto.render = function (frame) {
        var map = this._mapper[frame];
        //if (map.texture.src.indexOf('plus-icon-texture') > 0)
        //    log.info("----------------rendererx");
        if (this._renderMode === 'div') {
            var style = this._renderer.style;
            var cssValue = map.px + 'px';
            if (style.left !== cssValue) {
                style.left = cssValue;
            }
            cssValue = map.py + 'px';
            if (style.top !== cssValue) {
                style.top = cssValue;
            }
            cssValue = 'url("' + map.texture.src + '")';
            //console.log(cssValue)
            //if (map.texture.src.indexOf('plus-icon-texture') > 0)
            //console.log("style.backgroundImage:", style.backgroundImage, "   cssValue:", cssValue);
            if (style.backgroundImage !== cssValue) {
                style.backgroundImage = cssValue;
            }
            //console.log(style.backgroundImage)
            cssValue = -map.tx + 'px -' + map.ty + 'px';
            if (style.backgroundPosition !== cssValue) {
                style.backgroundPosition = cssValue;
            }
            style.backgroundRepeat = 'no-repeat';
            cssValue = map.pw + 'px';
            if (style.width !== cssValue) {
                style.width = cssValue;
            }
            cssValue = map.ph + 'px';
            if (style.height !== cssValue) {
                style.height = cssValue;
            }
        } else if (this._renderMode === 'canvas') {
            this._context.clearRect(0, 0, this._renderer.width, this._renderer.height);
            if (map.pw > 0 && map.ph > 0) {//equal 0 ie will report a error.
                this._context.drawImage(map.texture, map.tx, map.ty, map.pw, map.ph, map.px, map.py, map.pw, map.ph);
            }
        }
        if (this.step) {
            this.step.apply(this, arguments);
        }
        this._neverRender = false;
    };
    proto.useless = function () {
        return !utils.isInDocument(this._element) || !$(this._element).hasClass(Scheme.cssClassName);
    };
    proto.dispose = function () {
        this._disposed = true;
        Scheme.remove(this);
        for (var i = 0, il = this._textures.length; i < il; i++) {
            $(this._textures).off();
        }
        this._options = null;
        this._renderer = null;
        this._element = null;
        this._context = null;
        this._textures = null;
        this._mapper = null;
        this._poster = null;
        this._state = null;
    };

    return Scheme;
});
