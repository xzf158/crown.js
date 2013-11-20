define(["jquery", "hance", 'greensock/TweenMax'], function ($, hance) {
    var Scheme = hance.inherit("Dialog", function () { });
    Scheme.options = { features: {} };
    var proto = Scheme.prototype;
    proto.init = function () {
        var self = this;
        this.$body = $(document.body);
        this.$element = $('<div class="dialog-frame"><div class="mask"></div></div>').appendTo(this.$body).css({'z-index': 99999, opacity:0, display:'none', position:'absolute'});
        //this.$element.on('click', function () {
        //    self.close();
        //});
    };
    proto.open = function ($content) {
        if (this.$content && this.$content != $content) {
            this.close();
        }
        this.$content = $content;
        var self = this;
        var $closeButton = $content.find('.dialog-close-button');
        if ($closeButton.length <= 0) {
            $closeButton = $('<div class="button close-button dialog-close-button"></div>').appendTo($content);
        }
        $closeButton.one('click', function () {
            self.close();
        });
        stage.$document.one('keydown', function (e) {
            if (e == null) {
                keycode = e.keyCode;
            } else {
                keycode = e.which;
            }
            if (keycode == 27) {
                self.close();
            }
        });
        this.resize();
        TweenMax.killTweensOf($content[0]);
        TweenMax.killTweensOf(this.$element[0]);
        TweenMax.fromTo($content[0], .6, { 'z-index': 199999, opacity: 0, display: 'block' }, { opacity: 1, overwrite: 1, delay:.2, ease: Quart.easeIn });
        TweenMax.fromTo(this.$element[0], .5, { display: 'block', opacity: 0 }, { opacity: 1, overwrite: 1, ease: Quart.easeIn });
    };
    proto.close = function () {
        if (this.$content && this.$content.length > 0) {
            TweenMax.to(this.$content, .5, {
                opacity: 0, overwrite: 1, ease: Quart.easeInOut, onCompleteParams: [this.$content], onComplete: function ($content) {
                    $content.css({ display: 'none' });
                }
            });
        }
        TweenMax.to(this.$element, .5, {
            opacity: 0, overwrite: 1, ease: Quart.easeInOut, onCompleteParams: [this.$element], onComplete: function ($element) {
                $element.css({ display: 'none' });
            }
        });
        this.$content = null;
    };
    proto.resize = function () {
        if (this.$content) {
            var top = (stage.cache.window.height - this.$content.outerHeight()) / 2,
                left = (stage.cache.window.width - this.$content.outerWidth()) / 2;
            if (top > 0 && left > 0) {
                this.$content.css({ top: top, left: left, position:'fixed' });
            } else {
                top = stage.$document.scrollTop();
                left = Math.max(0, (stage.cache.document.width - this.$content.outerWidth()) / 2);
                this.$content.css({ top: top, left: left, position: 'absolute' });
            }
            this.$element.css({ width: stage.cache.document.width, height: stage.cache.document.height });
        }
    };

    return Scheme;
});
