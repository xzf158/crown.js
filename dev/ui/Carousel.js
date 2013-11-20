/// <reference path="../../scripts/parallax.js" />
define(['hance', 'jquery', 'hammer', 'modernizr', 'greensock/TweenMax'], function (hance, $, hammer) {
    var Artist = hance.inherit('crown.ui.Carousel.Artist', function () { });
    var aproto = Artist.prototype;
    hance.properties(aproto, [{ name: 'contentViewport', getter: true },
        { name: 'contentContainer', getter: true },
        { name: 'contents', getter: true },
        { name: 'stampContainer', getter: true },
        { name: 'stamps', getter: true },
        { name: 'prevButton', getter: true },
        { name: 'nextButton', getter: true },
        { name: 'currentIndex', getter: true }]);
    aproto.init = function (element, options) {
        this._element = $(element);
        this.options = options;
        this._contentViewport = this._element.find('.hn-contents');
        this._contentContainer = this._contentViewport.find('>ol');
        this._contents = this._element.find('.hn-content');
        this._currentIndex = -1;

        var self = this;

        this._prevButton = this._element.find('.prev-button');
        this._nextButton = this._element.find('.next-button');
        if (options.enableNaviButtons) {
            if (this._prevButton.length <= 0) {
                this._prevButton = $('<div class="hn-button navi-button prev-button"><span></span></div>').appendTo(this._element);
            }
            if (this._nextButton.length <= 0) {
                this._nextButton = $('<div class="hn-button navi-button next-button"><span></span></div>').appendTo(this._element);
            }
        }

        this._stampContainer = this._element.find('.hn-stamps>ol');
        if (options.enableStamps && this._stampContainer.length <= 0) {
            this._stampContainer = $('<div class="hn-stamps"><ol></ol></div>').appendTo(this._element).find('ol');
        }
        if (options.enableStamps) {
            if (this._stampContainer.find('.hn-stamp').length === 0) {
                for (var i = 0, il = this._contents.length; i < il; i++) {
                    $('<li><span></span></li>').appendTo(this.stampContainer).data('index', i).addClass('hn-stamp');
                }
                this._stamps = this._stampContainer.find('.hn-stamp');
            } else {
                this._stamps = this._stampContainer.find('.hn-stamp').each(function (index) {
                    var $this = $(this), contentName = $this.data('content-name'), contentGroup = $this.data('content-group');
                    if (contentName) {
                        $this.attr('data-index', self._contents.index(self._contents.filter('[data-name=' + contentName + ']')[0]));
                    } else if (contentGroup) {
                        $this.attr('data-index', self._contents.index(self._contents.filter('[data-group=' + contentGroup + ']')[0]));
                    } else {
                        $this.attr('data-index', index);
                    }
                });
            }
        }
    };
    aproto.ready = function () {
        var viewWidth = this.getDimension().width;
        this._contents.each(function (index) {
            $(this).css('left', viewWidth * index);
        });
    };
    aproto.layout = function () {
        var index = this._currentIndex < 0 ? 0 : this._currentIndex;
        var viewWidth = this.getDimension().width;
        for (var i = 0, il = this._contents.length; i < il; i++) {
            var $content = this._contents.eq(i);
            $content.css('left', i * viewWidth);
        }
        this.getContentContainer().css('left', -index * viewWidth);
    };
    aproto.dragContent = function (index, offset, animate) {
        var left = -this._contents.eq(index).position().left + offset;
        this.getContentContainer().css('left', left);
    };
    aproto.getDimension = function () {
        return { width: this.getContentViewport().width(), height: this.getContentViewport().height() };
    };
    aproto.getContentCount = function () {
        return this._contents.length;
    };
    aproto.getStampCount = function () {
        return this._stamps.length;
    };
    aproto.getTweenDuration = function (oldIndex, newIndex) {
        var duration = this.options.tweenDuration;
        if (typeof duration === 'function') {
            duration = duration(this._currentIndex, newIndex);
        }
        if (duration <= 0) {
            duration = Controller.options.tweenDuration;
        }
        return duration;
    };
    aproto.getTweenEase = function (oldIndex, newIndex) {
        var ease = this.options.tweenEase;
        if (typeof ease === 'function') {
            ease = ease(this._currentIndex, newIndex);
        }
        return ease;
    };
    aproto.setCurrentIndex = function (index, animate) {
        var self = this, viewWidth = this.getDimension().width, contentCount = this.getContentCount(),
            $oldContent = this._currentIndex >= 0 ? this.getContents().eq(this._currentIndex) : null,
            $newContent = this.getContents().eq(index),
            newName = $newContent.data('name'),
            newGroup = $newContent.data('group'),
            newLeft = -$newContent.position().left;
        this._prevButton.toggleClass('disabled', index === 0 && !this.options.enableLoop);
        this._nextButton.toggleClass('disabled', index === contentCount - 1 && !this.options.enableLoop);

        if (animate) {
            TweenLite.to(this.getContentContainer()[0], this.getTweenDuration(), { left: newLeft, overwrite: 1, ease: this.getTweenEase() });
        } else {
            this.getContentContainer().css({ left: newLeft });
        }
        if (this._stamps && this._currentIndex !== index) {
            if (this._stamps) {
                this._stamps.each(function () {
                    var $this = $(this), data = $this.data();
                    if ((newGroup && data.contentGroup === newGroup) || (newName && data.contentName === newName) || data.index === index) {
                        if (!$this.hasClass('active')) {
                            $this.addClass('active');
                        }
                    } else {
                        if ($this.hasClass('active')) {
                            $this.removeClass('active');
                        }
                    }
                });
            }
            this._currentIndex = index;
        }
    };
    aproto.canResponse = function () {
        return true;
    };

    var Controller = crown.inherit('crown.ui.Carousel', function () { });
    Controller.options = {
        interval: 0, enableStamps: false, enableNaviButtons: true, enableLoop: false, enableTouch: true,tweenDuration:0.7,tweenEase:Expo.easeOut
    };
    Controller.cssClassName = 'hn-carousel';
    Controller._instances = [];

    Controller.sync = function () {
        $('.' + Controller.cssClassName).each(function () {
            if (!Controller.get(this) && !$(this).data('carousel-state')) {
                new Controller(this);
            }
        });
    };
    Controller.clean = function () {
        for (var i = Controller._instances.length - 1; i >= 0; i--) {
            var instance = Controller._instances[i];
            if (instance.useless()) {
                Controller._instances.splice(i, 1);
                instance.dispose();
                instance = null;
            }
        }
    };
    Controller.get = function (element) {
        for (var i = 0, il = Controller._instances.length; i < il; i++) {
            var instance = Controller._instances[i];
            if (instance._element === element) {
                return instance;
            }
        }
        return null;
    };
    Controller.remove = function (instance) {
        var index = Controller._instances.indexOf(instance);
        if (index >= 0) {
            Controller._instances.splice(index, 1);
        }
    };
    var cproto = Controller.prototype;
    crown.properties(cproto, [{ name: 'currentIndex', getter: true, setter: false },
        { name: 'dimension', getter: true, setter: false },
        { name: 'contentCount', getter: true, setter: false },
        { name: 'stampCount', getter: true, setter: false }]);
    cproto.init = function (element, options) {
        var $element = this._element = $(element);
        if ($element.length === 0) {
            throw new Error('Element can not be empty!');
        }
        if($element.data("carousel-state") === 'built') {
            return;
        }
        var self = this;
        var options = this.options = $.extend({}, Controller.options, $element.data(), options);
        //$element.data("carousel-state", "built")[0];
        var artist = this.artist = options.artist || new Artist(element, options);

        artist.ready();
        this._isTouchEnded = true;
        if (options.enableTouch) {
            hammer(this.artist.getContentContainer()[0], { drag_lock_to_axis: true })
                .on("release dragleft dragright swipeleft swiperight", function (ev) {
                    ev.gesture.preventDefault();
                    if (!self.artist.canResponse()) {
                        return;
                    }
                    switch (ev.type) {
                        case 'dragright':
                        case 'dragleft':
                            //console.log('>>>>>>>>>>>drag')
                            // stick to the finger
                            var dragOffset = Math.min(Math.max(ev.gesture.deltaX, -$element.width()), $element.width());

                            // slow down at the first and last pane
                            if ((self._currentIndex === 0 && ev.gesture.direction === Hammer.DIRECTION_RIGHT) ||
                                 (self._currentIndex === self.artist.getContentCount() - 1 && ev.gesture.direction === Hammer.DIRECTION_LEFT)) {
                                dragOffset *= 0.4;
                            }
                            self.artist.dragContent(self._currentIndex, dragOffset);
                            //self.options.setItemOffset.call(self, self._currentIndex, dragOffset);
                            if (self.options.onUpdate) {
                                self.options.onUpdate(self._currentIndex);
                            }
                            self._isTouchEnded = false;
                            break;

                        case 'swipeleft':
                            //console.log('>>>>>>>>>>>swipeleft')
                            self.next(true, true);
                            ev.gesture.stopDetect();
                            self._isTouchEnded = true;
                            break;

                        case 'swiperight':
                            //console.log('>>>>>>>>>>>swiperight')
                            self.prev(true, true);
                            ev.gesture.stopDetect();
                            self._isTouchEnded = true;
                            break;

                        case 'release':
                            //console.log('>>>>>>>>>>>release', self._isTouchEnded)
                            if (!self._isTouchEnded) {
                                // more then 50% moved, navigate
                                if (Math.abs(ev.gesture.deltaX) > self.artist.getDimension().width / 2) {
                                    if (ev.gesture.direction === 'right') {
                                        self.prev(true, true);
                                    } else {
                                        self.next(true, true);
                                    }
                                }
                                else {
                                    self.setCurrentIndex(self._currentIndex, true, true);
                                }
                                self._isTouchEnded = true;
                            }
                            break;
                    }
                });
        }
        //$element.on('mousedown', function () {
        //    $(document).one('mouseup', function () {
        //        //console.log('========document mouse up', self._isTouchEnded)
        //        if (self._isTouchEnded !== false) return;
        //        var $item = self.getContents().eq(self._currentIndex);
        //        if (Math.abs($item.position().left) > self.artist.getDimension().width / 2) {
        //            if ($item.position().left > 0) {
        //                self.prev(true);
        //            } else {
        //                self.next(true);
        //            }
        //        }
        //        else {
        //            self.setCurrentIndex(self._currentIndex, true);
        //        }
        //    });
        //});
        if (options.enableNaviButtons) {
            var $prevButton = self.artist.getPrevButton(), $nextButton = self.artist.getNextButton();
            //if (Modernizr && Modernizr.touch) {
            //    $prevButton.click(function (e) {
            //        if (!self.artist.canResponse()) return;
            //        e.preventDefault();
            //        return false;
            //    });
            //    //$prevButton[0].addEventListener('touchstart', function (e) {
            //    //    if (!self.artist.canResponse()) return;
            //    //    e.preventDefault();
            //    //    //console.log('prev button touched')
            //    //    self.prev(true);
            //    //}, false);
            //    $nextButton.click(function (e) {
            //        if (!self.artist.canResponse()) return;
            //        e.preventDefault();
            //        return false;
            //    });
            //    //$nextButton[0].addEventListener('touchstart', function (e) {
            //    //    if (!self.artist.canResponse()) return;
            //    //    e.preventDefault();
            //    //    //console.log('next button touched')
            //    //    self.next(true);
            //    //}, false);
            //} else {
                $prevButton.click(function (e) {
                    //e.preventDefault();
                    if (!self.artist.canResponse()) {
                        return;
                    }
                    self.prev(true, false);
                    return false;
                });
                $nextButton.click(function (e) {
                    //e.preventDefault();
                    if (!self.artist.canResponse()) {
                        return;
                    }
                    self.next(true, false);
                    return false;
                });
            //}
        }
        if (options.enableStamps) {
            this.artist.getStamps().on('click', function () {
                if (!self.artist.canResponse()) {
                    return;
                }
                var index = $(this).data('index');
                self.setCurrentIndex(index, true);
                cancelAutoScrollThisTime = true;
            });
        }
        var cancelAutoScrollThisTime = false;

        this.setCurrentIndex(0, false);

        if (options.interval) {
            this.autoScrollIntervalId = setInterval(function () {
                if (!cancelAutoScrollThisTime) {
                    self.next(true);
                } else {
                    cancelAutoScrollThisTime = false;
                }
            }, 5000);
        }
    };
    cproto.next = function (animate, afterDrag) {
        this.setCurrentIndex(this._currentIndex + 1, animate, afterDrag);
    };
    cproto.prev = function (animate, afterDrag) {
        this.setCurrentIndex(this._currentIndex - 1, animate, afterDrag);
    };
    cproto.getDimension = function () {
        return  this.artist.getDimension();
    };
    cproto.getContentCount = function () {
        return this.artist.getContentCount();
    };
    cproto.getStampCount = function () {
        return this.artist.getStampCount();
    };
    cproto.setCurrentIndex = function (index, animate, afterDrag) {
        var contentCount = this.artist.getContentCount();
        if (!this.options.enableLoop && (index >= contentCount || index < 0)) {
            index = Math.max(0, Math.min(contentCount - 1, index));
        }

        index = (index % contentCount + contentCount) % contentCount;

        var event = $.Event("index");
        event.oldIndex = this._currentIndex;
        event.newIndex = index;
        $(this).trigger(event);
        this._currentIndex = index;
        this.artist.setCurrentIndex(index, animate, afterDrag);
    };
    cproto.layout = function () {
        if (this.artist){
            this.artist.layout();
        }
    };
    cproto.useless = function () {
        return !crown.ui.utils.isInDocument(this._element) || !$(this._element).hasClass(Controller.cssClassName);
    };
    cproto.dispose = function () {
        if (this.autoScrollIntervalId !== undefined) {
            clearInterval(this.autoScrollIntervalId);
        }
        this._element.data('carousel-state', 'disposed');
        Controller._instances.splice(Controller._instances.indexOf(this), 1);
    };
    return Controller;
});