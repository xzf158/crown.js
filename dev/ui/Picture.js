define(['hance', 'crown/ui/utils', 'jquery'], function (hance, utils, $) {
    var Scheme = hance.inherit("crown.ui.Picture", function () { });
    Scheme.options = { autoLoad: true, renderMode: 'canvas' };
    Scheme.cssClassName = 'hn-picture';
    Scheme._instances = [];
    Scheme.sync = function () {
        $('.' + Scheme.cssClassName).each(function () {
            if (!Scheme.get(this)) {
                new Scheme(this);
            }
        });
        return this;
    };
    Scheme.clean = function () {
        for (var i = Scheme._instances.length - 1; i >= 0; i--) {
            var instance = Scheme._instances[i];
            if (instance.useless()) {
                Scheme._instances.splice(i, 1);
                instance.dispose();
                instance = null;
            }
        }
        return this;
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
    };

    var proto = Scheme.prototype;
    hance.properties(proto, [{ name: 'element', getter: true, setter: false },
    { name: 'options', getter: true, setter: false },
    { name: 'loaded', getter: true, setter: false }
    ]);
    proto.init = function (element, options) {
        var instance = Scheme.get(element);
        if (instance) {
            return instance;
        }
        Scheme._instances.push(this);
        this._element = element;
        this._options = options;

        this.build(options);
    };
    proto.build = function (options) {
        var element = this._element;
        var $element = $(element).attr('data-built', true);
        options = this._options = $.extend({}, Scheme.options, $element.data(), options);
        this._renderMode = options.renderMode;

        if (this._renderMode === 'canvas' && (Modernizr && !Modernizr.canvas)) {
            this._renderMode = 'img';
        }

        if (['absolute', 'relative'].indexOf($element.css('position')) < 0 && options.spinner) {
            $element.css('position', 'relative');
        }
        if (options.spinner) {
            $element.html('<div class="hn-spinner"><img src="' + options.spinner + '" alt="loading..." /></div>');
        }
        if (options.autoLoad) {
            this.load();
        }
    };
    proto._textureLoadHandler = function (img) {
        if (this._disposed) {
            return;
        }
        this._loaded = true;

        var $renderer = $(this._element).find('>.hn-renderer');
        if ($renderer.length > 0) {
            this._renderer = $renderer[0];
        } else {
            if (this._renderMode === 'img') {
                this._renderer = $('<img class="hn-renderer" style="visibility:hidden;" alt="">').prependTo(this._element)[0];
            } else if (this._renderMode === 'canvas') {
                this._renderer = $('<canvas class="hn-renderer">').prependTo(this._element)[0];
            }
        }

        $(this._element).attr('data-loaded', true).find('.hn-spinner').remove();
        if (this._texture.width > 0 && this._texture.height > 0) {
            $(this._renderer).attr({ 'data-stage-width': this._texture.width, 'data-stage-height': this._texture.height });
        }
        if (this._renderMode === 'img') {
            $(this._renderer).css('visibility', '').attr('src', this._options.source);
        } else if (this._renderMode === 'canvas') {
            this._context = this._renderer.getContext('2d');
            this._renderer.width = this._texture.width;
            this._renderer.height = this._texture.height;
            this._context.drawImage(this._texture, 0, 0, this._texture.width, this._texture.height);
        }
        $(this).trigger('loaded');
    };
    proto.load = function () {
        var self = this, deferred = $.Deferred();
        this._texture = $('<img>').one('load', function (e) {
            self._texture = this;//fix ie8 error
            self._textureLoadHandler.call(self, this);
            deferred.resolve();
        }).on('error', function () {
            $(self).trigger('error');
            self._loaded = true;
            self._failed = true;
            deferred.resolve();
        }).attr('src', self._options.source)[0];
        if (this._texture.complete && this._texture.readyState === 4) {
            this._textureLoadHandler.call(this, this._texture);
            return deferred.resolve();
        }
        return deferred.promise();
    };
    proto.useless = function () {
        return !utils.isInDocument(this._element) || !$(this._element).hasClass(Scheme.cssClassName);
    };
    proto.dispose = function () {
        this._disposed = true;
        $(this._element).removeAttr('data-loaded', 'data-built').html('');
        Scheme.remove(this);
        $(this._texture).off();
        this._element = null;
        this._options = null;
        this._renderer = null;
        this._context = null;
    };
    return Scheme;
});