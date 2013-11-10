/// <reference path="../jquery/jquery-1.5.2.js" />
/// <reference path="crown.core.js" />
/// <reference path="crown.Object.js" />

define(['crown', 'jquery'], function (crown, $) {
    var Scheme = crown.inherit('crown.ui.Scroller', function () { });
    Scheme.options = {
        wheel: 40, //how many pixels must the mouswheel scroll at a time.
        size: 'auto', //set the size of the scrollbar to auto or a fixed number.
        wrapper: 'body',
        viewport: '.viewport',
        overview: '.overview',
        vtrack: '.vtrack',
        htrack: '.htrack',
        vthumb: '.vthumb',
        hthumb: '.hthumb',

        start: function(){
        },
        step: function(){
        },
        end: function(){
        }
    };
    var proto = Scheme.prototype;
    crown.properties(proto, [{ name: 'vratio', getter: true, setter: true }]);
    crown.properties(proto, [{ name: 'hratio', getter: true, setter: true }]);
    proto.init = function (options) {
        this.options = $.extend({}, Scheme.options, options);
        this.wrapper = $(this.options.wrapper);
        this.viewport = $(this.options.viewport, this.wrapper);
        this.overview = $(this.options.overview, this.wrapper);
        this.vtrack = $(this.options.vtrack, this.wrapper);
        this.htrack = $(this.options.htrack, this.wrapper);
        this.vthumb = $(this.options.vthumb, this.wrapper);
        this.hthumb = $(this.options.hthumb, this.wrapper);
        this.scrolling = false;
        this._vratio = 0;
        this._hratio = 0;
        this.setEvents();
        this.layout();
        //$(window).resize(this.resize);
        return this;
    };
    proto.layout = function () {
        //console.log(this.viewport.height(), "    ", this.overview.height());
        if (this.viewport.height() >= this.overview.height()) {
            this.vtrack.css('display', 'none');
            this.vthumb.css('display', 'none');
        } else {
            this.vtrack.css('display', 'block');
            this.vthumb.css('display', 'block');
        }
        if (this.viewport.width() >= this.overview.width()) {
            this.htrack.css('display', 'none');
            this.hthumb.css('display', 'none');
        } else {
            this.htrack.css('display', 'block');
            this.hthumb.css('display', 'block');
        }
    };
    proto.setHratio = function (value) {
        this._hratio = Math.min(Math.max(value, 0), 1);
        if (this.overview.width() <= this.viewport.width()) {
            this._hratio = 0;
        }
        this.hthumb.offset({left: this.htrack.offset().left + this._hratio * (this.htrack.width() - this.hthumb.width()) });
        this.overview.offset({left:this.viewport.offset().left - this._hratio * (this.overview.width() - this.viewport.width())});
    };
    proto.setVratio = function (value) {
        this._vratio = Math.min(Math.max(value, 0), 1);
        if (this.overview.height() <= this.viewport.height()) {
            this._vratio = 0;
        }
        this.vthumb.offset({top: this.vtrack.offset().top + this._vratio * (this.vtrack.height() - this.vthumb.height()) });
        //console.log('overwiewheight:', this.overview.height(), '  viewportheight:', this.viewport.height());
        this.overview.offset({top:this.viewport.offset().top - this._vratio * (this.overview.height() - this.viewport.height())});
    };
    proto.setEvents = function () {
        var self = this;
        this.vthumb.on('mousedown', $.proxy(this,'start', this));
        this.hthumb.on('mousedown', $.proxy(this,'start', this));
        var touchStartHandler = function (e) {
            e.preventDefault();
            self.vthumb.off('mousedown');
            self.start(e.touches[0]);
            return false;
        };
        if (this.vthumb[0]) {
            this.vthumb[0].ontouchstart = touchStartHandler;
        }
        if (this.hthumb[0]) {
            this.hthumb[0].ontouchstart = touchStartHandler;
        }
        this.vtrack.on('mouseup', $.proxy(this, 'drag', this, false));
        this.htrack.on('mouseup', $.proxy(this, 'drag', this, false));
        if (this.wrapper[0].addEventListener) {
            this.wrapper[0].addEventListener('DOMMouseScroll', $.proxy(this, 'wheel', this), false);
            this.wrapper[0].addEventListener('mousewheel', $.proxy(this, 'wheel', this), false);
        }
        else {
            this.wrapper[0].onmousewheel = $.proxy(this, 'wheel', this);
        }
    };
    proto.start = function (self, e) {
        self.startX = e.pageX;
        self.startY = e.pageY;
        if (self.hthumb.length > 0) {
            self.startHthumbX = e.pageX - self.hthumb.offset().left;
        }
        if (self.vthumb.length > 0) {
            self.startVthumbY = e.pageY - self.vthumb.offset().top;
        }
        $(document).on('mousemove', $.proxy(self, 'drag', self, true));
        document.ontouchmove = function (e) {
            $(document).unbind('mousemove');
            self.drag(e.touches[0]);
        };
        $(document).one('mouseup', $.proxy(self, 'end', self));
        $(document).one('blur', $.proxy(self, 'end', self));
        self.vthumb.one('mouseup', $.proxy(self, 'end', self));
        self.hthumb.one('mouseup', $.proxy(self, 'end', self));
        var touchEndHandler = function (e) {
            $(document).off('mouseup blur');
            self.thumb.off('mouseup');
            self.end(e.touches[0]);
        };
        document.ontouchend = touchEndHandler;
        if (self.vthumb[0]) {
            self.vthumb[0].ontouchend = touchEndHandler;
        }
        if (self.hthumb[0]) {
            self.hthumb[0].ontouchend = touchEndHandler;
        }

        self.scrolling = true;
        clearTimeout(self.scrollTimeOutId);
        self.options.start();
        return false;
    };
    proto.wheel = function (self, e) {
        var delta = (e.wheelDelta ? e.wheelDelta / 120 : -e.detail / 3) * self.options.wheel;
        if (self.vthumb.length > 0) {
            var vratio = self.vratio;
            self.vratio = (self.vratio * self.overview.height() - delta) / self.overview.height();
            if (self.vratio !== vratio) {
                e.preventDefault();
            }
        } else if (self.hthumb.length > 0) {
            var hratio = self.hratio;
            self.hratio = (self.hratio * self.overview.width() + delta) / self.overview.width();
            if (self.hratio !== hratio) {
                e.preventDefault();
            }
        }
        clearTimeout(self.scrollTimeOutId);
        self.scrollTimeOutId = setTimeout(function () {
            self.scrolling = false;
            self.options.end();
        }, 800);
        if (self.scrolling) {
            self.options.step();
        }
        else {
            self.options.start();
            self.scrolling = true;
        }
    };
    proto.drag = function (self, isDragThumb, e) {
        if (self.options.vthumb.indexOf(e.currentTarget) || self.options.vtrack.indexOf(e.currentTarget)) {
            self.currentDirection = 'v';
        }
        else if (self.options.hthumb.indexOf(e.currentTarget) || self.options.htrack.indexOf(e.currentTarget)) {
            self.currentDirection = 'h';
        }
        self.currentX = e.pageX;
        self.currentY = e.pageY;
        if (self.currentDirection === 'v') {
            if (isDragThumb) {
                //console.log("thumb ratio: " + self.vratio);
                self.vratio = (self.currentY - self.vtrack.offset().top - self.startVthumbY) / (self.vtrack.height() - self.vthumb.height());
            } else {
                self.vratio = (self.currentY - self.vtrack.offset().top - self.vthumb.height() * 0.5) / (self.vtrack.height() - self.vthumb.height());
                //console.log("ratio: " + self.vratio);
            }
        }
        if (self.currentDirection === 'h') {
            if (isDragThumb) {
                //console.log("thumb ratio: " + self.vratio);
                self.hratio = (self.currentX - self.htrack.offset().top - self.startHthumbX) / (self.htrack.width() - self.hthumb.width());
            } else {
                self.hratio = (self.currentX - self.htrack.offset().top - self.hthumb.width() * 0.5) / (self.htrack.width() - self.hthumb.width());
                //console.log("ratio: " + self.vratio);
            }
        }
        self.isDragThumb = isDragThumb;
        self.options.step();
        self.scrolling = false;
        //return false;
    };
    proto.end = function (self) {
        $(document).off('mousemove', self.drag)
            .off('mouseup', self.end)
            .off('blur', self.end);
        self.vthumb.off('mouseup', self.end);
        self.hthumb.off('mouseup', self.end);
        document.ontouchmove = document.ontouchend = null;
        if (self.vthumb[0]){
            self.vthumb[0].ontouchend = null;
        }
        if (self.hthumb[0]) {
            self.hthumb[0].ontouchend = null;
        }
        this.options.end();
        return false;
    };
});