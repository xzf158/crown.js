define(['jquery', 'hance', 'crown/player/utils'], function ($, hance, utils) {
    var Scheme = hance.inherit('crown.player.surfaces.Classic', function () { });
    var proto = Scheme.prototype;
    proto.init = function (player, options) {
        this.cssClass = 'cwp-surface-classic' + (utils.platform.supportsSvg ? ' detect-svg' : ' detect-non-svg') + (utils.platform.hasTouch ? ' detect-touch' : ' detect-non-touch');
        this.player = player;
        this.essence = player.essence;
        this.renderer = this.essence.renderer;
        this.$renderer = this.essence.$renderer;
        this.options = options;
        this.playedTimes = 0;
        this.isPlay = false;
        this.isPlaying = false;
        this.descendants = {};
        this.features = [];
        this.built = false;
        var self = this;

        for (var i = 0, il = options.features.length; i < il; i++) {
            var feature = options.features[i];
            if (typeof feature === 'object') {
                if (feature.name) {
                    if (feature.build) {
                        this['build_' + feature.name] = feature.build;
                    }
                    if (feature.layout) {
                        this['layout_' + feature.layout] = feature.layout;
                    }
                }
                this.features[i] = feature.name;
            } else if (typeof feature === 'string') {
                this.features[i] = feature;
            }
        }
    };
    proto.node_live = function ($node) {
        $node.removeClass('cwp-state-dead').addClass('cwp-state-live');
    };
    proto.node_dead = function ($node) {
        $node.removeClass('cwp-state-live').addClass('cwp-state-dead');
    };
    proto.ready = function () {
        if (this.built !== true) {
            return;
        }
        var self = this;
        self.layout();
        //var autoHideTimeoutId;
        self.$node.on('mousemove.surface', function () {
            self.node_live(self.$controls);
            //clearTimeout(autoHideTimeoutId);
            //setTimeout(function () {
            //    if (self.$controls.hasClass('cwp-state-live')) {
            //        self.node_dead(self.$controls);
            //    }
            //}, 1500);
        }).on('mouseleave.surface', function () {
            if (!self.essence.getIsPaused() && !self.essence.getIsEnded()) {
                //clearTimeout(autoHideTimeoutId);
                self.node_dead(self.$controls);
            }
        });
        $(self.essence).on('ended.surface', function (e) {
            if (self.player.options.loop) {
                self.essence.play();
            } else {
                //clearTimeout(autoHideTimeoutId);
                self.node_live(self.$controls);
            }
        });
    };
    proto.layout = function () {
        if (this.built !== true){
            return;
        }

        for (var i = 0, il = this.features.length; i < il; i++) {
            var feature = this.features[i];
            if (this['layout_' + feature]) {
                this['layout_' + feature]();
            }
        }
    };
    proto.dispose = function () {
        this.$node.off('.surface').remove();
        $(this.essence).off('.surface');
        this.node = null;
        this.essence = null;
    };
    proto.build = function () {
        var self = this;
        if ((utils.platform.isiPad && this.options.iPadUseNativeControls) || (utils.platform.isiPhone && this.options.iPhoneUseNativeControls)) {
            this.$renderer.attr('controls', 'controls');
            this.player.$node.addClass(this.cssClass).addClass('cwp-theme-native');
            if (utils.platform.isiPad && this.renderer.getAttribute('autoplay')) {
                this.essence.load();
                this.essence.play();
            }
        } else if (utils.platform.isAndroid && this.options.androidUseNativeControls) {
        } else {
            this.$node = $('<div class="cwp-surface"></div>');
            this.node = this.$node[0];
            this.descendants.$controls = this.$controls = this.$controls = $('<div class="cwp-controls"></div>').appendTo(this.node);
            this.controls = this.controls = this.$controls[0];
           // this.player.$node.addClass(this.cssClass).addClass('cwp-theme-' + this.player.options.theme);

            this.build_poster();
            for (var i = 0, il = this.features.length; i < il; i++) {
                var feature = this.features[i], featureName = this.features[i];
                if (typeof feature === 'object') {
                    featureName = feature.name;
                    if (feature.build) {
                        this['build_' + feature] = feature.build;
                    }
                    if (feature.layout) {
                        this['layout_' + feature] = feature.layout;
                    }
                }
                if (this['build_' + featureName]) {
                    this['build_' + featureName]();
                }
            }
            this.player.$node.find('.surface').remove();
            this.player.$node.append(this.node);
            this.built = true;
        }

        $(this.essence).on('play.surface', function () {
            self.isPlay = true;
            self.player.$node.removeClass('cwp-state-pause').addClass('cwp-state-play');
        }).on('playing.surface', function () {
            self.isPlaying = true;
            self.player.$node.removeClass('cwp-state-pause ').addClass('cwp-state-play');
        })//.on('seeking', function () {
          //  self.player.$node.removeClass('cwp-state-play').addClass('cwp-state-pause');
        //})
        .on('pause.surface', function () {
            self.player.$node.removeClass('cwp-state-play').addClass('cwp-state-pause');
        }).on('paused.surface', function () {
            self.player.$node.removeClass('cwp-state-play').addClass('cwp-state-pause');
        }).on('ended.surface', function () {
            if (!self.player.options.loop) {
                self.player.$node.removeClass('cwp-state-play').addClass('cwp-state-pause');
            }
        });
    };
    proto.build_poster = function () {
        var self = this;
        this.descendants.$poster = $('<div class="cwp-poster"></div>')
                    .appendTo(this.node);
        var posterUrl = this.options.poster;

        if (posterUrl) {
            this.descendants.$poster.append('<img alt="" src="' + posterUrl + '" />');
        } else {
            self.node_dead(this.descendants.$poster);
        }

        $(this.essence).on('play.surface', function (e) {
            self.node_dead(self.descendants.$poster);
        }).on('ended.surface', function (e) {
            //if (self.options.autoRewind) {
            self.node_live(self.descendants.$poster);
            //}
        }).on('stop.surface', function () {
            self.node_live(self.descendants.$poster);
        }, false);
    };
    proto.build_overlay = function () {
        this.descendants.$overlay = $('<div class="cwp-overlay"><div class="cwp-button cwp-control cwp-overlay-control"><span></span></div></div>')
                    .appendTo(this.node);

        var self = this;
        this.descendants.$overlay.click(function () {
            if (self.essence.getIsPaused() || self.essence.getIsEnded()) {
                self.essence.play();
            } else {
                self.essence.pause();
            }
        });
    };
    proto.build_spinner = function () {
        this.descendants.$spinner = $('<div class="cwp-control cwp-spinner"><span></span></div>')
                    .appendTo(this.node);
        var self = this;
        $(self.essence).on("loadeddata.surface", function () { self.node_dead(self.descendants.$spinner); })
            .on("loadstart.surface", function () { if (self.isPlay) { self.node_live(self.descendants.$spinner); } })
            .on("canplay.surface", function () { self.node_dead(self.descendants.$spinner); })
            .on("canplaythrough.surface", function () { self.node_dead(self.descendants.$spinner); })
            .on("waiting.surface", function () { if (self.isPlay) { self.node_live(self.descendants.$spinner); } })
            .on("playing.surface", function () { self.node_dead(self.descendants.$spinner); })
            .on("timeupdate.surface", function () {
                self.node_dead(self.descendants.$spinner);
            }, false);
    };
    proto.build_play = function () {
        this.descendants.$play = $('<div class="cwp-button cwp-control cwp-play-control"><span></span></div>')
            .appendTo(this.controls);

        var self = this;
        this.descendants.$play.click(function () {
            if (self.essence.getIsPaused() || self.essence.getIsEnded()) {
                self.essence.play();
            } else {
                self.essence.pause();
            }
        });

    };
    proto.build_scrubber = function () {
        this.descendants.$scrubber = $('<div class="cwp-control cwp-scrubber-control"><span class="cwp-scrubber-inner">' +
        '<span class="cwp-time-total"></span><span class="cwp-time-loaded"></span><span class="cwp-time-played"></span><span class="cwp-button cwp-time-handle"></span>' +
        '<span class="cwp-time-float"><span class="cwp-float-value">00:00</span><span class="cwp-float-corner"></span></span>' +
        '</span></div>').appendTo(this.controls);

        var self = this, $leader = self.descendants.$scrubber.find('.cwp-scrubber-inner'),
            $loaded = $leader.find('.cwp-time-loaded').data('value', 0),
            $played = $leader.find('.cwp-time-played').data('value', 0),
            $handle = $leader.find('.cwp-time-handle'),
            $timeFloat = $leader.find('.cwp-time-float'),
            $timeFloatValue = $timeFloat.find('.cwp-float-value'),
            setLoadedProgress = function (e) {
                $loaded.width($leader.width() * e.ratio).data('value', e.ratio);
            },
            setCurrentTime = function (e) {
                if (self.essence.getDuration()) {
                    // update bar and handle
                    var newWidth = $leader.width() * e.ratio,
                    handlePos = newWidth * ($leader.width() - $handle.outerWidth(true)) / $leader.width();
                    $played.width(newWidth).data('value', e.ratio);
                    $handle.css('left', handlePos);
                }
            },
            onMouseMove = function (e) {
                // mouse position relative to the object
                var x = e.pageX,
                    offset = $leader.offset(),
                    width = $leader.outerWidth(),
                    percentage = 0,
                    newTime = 0;

                if (x > offset.left && x <= width + offset.left && self.essence.getDuration()) {
                    percentage = ((x - offset.left) / width);
                    newTime = (percentage <= 0.02) ? 0 : percentage * self.essence.getDuration();

                    // seek to where the mouse is
                    if (isMouseDown) {
                        self.essence.setCurrentTime(newTime);
                        if (self.essence.getIsPaused()) {
                            self.essence.play();
                        }
                    }

                    // position floating time box
                    var pos = x - offset.left;
                    $timeFloat.css('left', pos);
                    $timeFloatValue.html(utils.secondsToTimeCode(newTime));
                }
            },
            isMouseDown = false,
            isMouseOver = false;
        $leader.on('mousedown.surface', function (e) {
            isMouseDown = true;
            onMouseMove(e);
            return false;
        });

        self.descendants.$scrubber.on('mouseenter.surface', function (e) {
            isMouseOver = true;
        }).on('mouseleave.surface', function (e) {
            isMouseOver = false;
        });

        $(document).on('mouseup.surface', function (e) {
            isMouseDown = false;
        }).on('mousemove.surface', function (e) {
            if (isMouseDown || isMouseOver) {
                onMouseMove(e);
            }
        });

        $(self.essence).on('progress.surface', function (e) {
            setLoadedProgress(e);
        }).on('timeupdate.surface', function (e) {
            setCurrentTime(e);
        });
    };

    proto.layout_scrubber = function () {
        // console.log('Scheme scrubber===');
        var $scrubber = this.descendants.$scrubber, usedWidth = 0, railWidth = 0;
        var $scrubberLeader = $scrubber.find('.cwp-scrubber-inner'),
            $timeLoaded = $scrubberLeader.find('.cwp-time-loaded'),
            $timePlayed = $scrubberLeader.find('.cwp-time-played'),
            $others = this.descendants.$scrubber.siblings();

        // find the size of all the other controls besides the rail
        $others.each(function () {
            if ($(this).css('position') !== 'absolute') {
                usedWidth += $(this).outerWidth(true);
            }
        });
        // fit the rail into the remaining space
        railWidth = this.$controls.width() - usedWidth - ($scrubber.outerWidth(true) - $scrubber.outerWidth(false)) - 1; //ie -1
        $scrubber.width(railWidth);
        $scrubberLeader.width(railWidth - ($scrubberLeader.outerWidth(true) - $scrubberLeader.width()));
        $scrubberLeader.find('.cwp-time-total').width($scrubberLeader.width());
        $timeLoaded.width($timeLoaded.data('value') * $scrubberLeader.width());
        $timePlayed.width($timePlayed.data('value') * $scrubberLeader.width());
    };
    proto.build_time = function () {
        this.descendants.$time = $('<div class="cwp-time-control"><span class="cwp-current">00:00</span><span class="cwp-slash">/</span>' +
        '<span class="cwp-duration">00:00</span></div>')
                    .appendTo(this.controls);
        var self = this;
        $(this.essence).on('timeupdate.surface', function () {
            self.descendants.$time.find('.current').html(utils.secondsToTimeCode(self.essence.getCurrentTime()));
            self.descendants.$time.find('.duration').html(utils.secondsToTimeCode(self.essence.getDuration()));
        });
    };
    proto.build_current = function () {
        this.descendants.$current = $('<div class="cwp-time-control"><span class="cwp-current">00:00</span></div>')
                    .appendTo(this.controls);
        var self = this;
        $(this.essence).on('timeupdate.surface', function (e) {
            self.descendants.$current.find('.cwp-current').html(utils.secondsToTimeCode(self.essence.getCurrentTime()));
        });
    };
    proto.build_duration = function () {
        this.descendants.$duration = $('<div class="cwp-time-control"><span class="cwp-duration">00:00</span></div>')
                    .appendTo(this.controls);
        var self = this;
        $(this.essence).on('timeupdate.surface', function (e) {
            self.descendants.$duration.find('.cwp-duration').html(utils.secondsToTimeCode(self.essence.getDuration()));
        });
    };
    proto.build_volume = function () {
        if (utils.platform.isiOS) {
            return;
        }
        this.descendants.$volume = $('<div class="cwp-button cwp-volume-control"><span></span><div class="cwp-volume-slider"><div class="cwp-slider-inner">' +
        '<div class="cwp-volume-total"></div><div class="cwp-volume-current"></div><div class="cwp-volume-handle">' +
        '</div></div></div></div>').appendTo(this.controls);

        var self = this, $volumeSlider = self.descendants.$volume.find('.cwp-volume-slider'),
        $volumeTotal = $volumeSlider.find('.cwp-volume-total'),
        $volumeCurrent = $volumeSlider.find('.cwp-volume-current'),
        $volumeHandle = $volumeSlider.find('.cwp-volume-handle'),
        positionVolumeHandle = function (volume) {
            var volumeTotalHeight = $volumeTotal.height();
            var volumeTotalWidth = $volumeTotal.width();
            if (volumeTotalHeight > volumeTotalWidth) {
                var top = volumeTotalHeight * (1 - volume);
                // handle must set leader css postion relative, for volumeTotal.position().top will always return 0 if it invisible(first time).
                var handleTop = top * (volumeTotalHeight - $volumeHandle.height()) / volumeTotalHeight;
                $volumeHandle.css({ top: handleTop });
                // show the current visibility
                //$volumeCurrent.height(volumeTotalHeight - handleTop);
                $volumeCurrent.css({ top: handleTop, height: volumeTotalHeight - handleTop });
            } else {
                var left = volumeTotalWidth * volume;
                // handle must set leader css postion relative, for volumeTotal.position().top will always return 0 if it invisible(first time).
                var handleLeft = left * (volumeTotalWidth - $volumeHandle.width()) / volumeTotalWidth;
                $volumeHandle.css('left', handleLeft); //
                // show the current visibility
                $volumeCurrent.width(handleLeft);
            }
        },
        onVolumeMove = function (e) {
            var totalOffset = $volumeTotal.offset(), volume = 0;
            if ($volumeTotal.height() > $volumeTotal.width()) {
                var railHeight = $volumeTotal.height(), newY = e.pageY - totalOffset.top;
                volume = (railHeight - newY) / railHeight;
            } else {
                var railWidth = $volumeTotal.width(), newX = e.pageX - totalOffset.left;
                volume = newX / railWidth;
            }

            // set mute status

            //console.log('set volume:' + volume);
            volume = Math.max(0, volume);
            volume = Math.min(volume, 1);

            // set the volume
            self.essence.setVolume(volume);
            //console.log("  volume:" + volume);
            if (volume > 0) {
                self.essence.setIsMuted(false);
            }
        },
        onVolumeChange = function (e) {
            //if (!isMouseDown) {//before mouse up event
            if (self.essence.getIsMuted()) {
                self.player.$node.removeClass('cwp-state-unmute').addClass('cwp-state-mute');
                positionVolumeHandle(0);
            } else {
                positionVolumeHandle(self.essence.getVolume());
                if (self.essence.volume === 0) {
                    self.player.$node.removeClass('cwp-state-unmute').addClass('cwp-state-mute');
                } else {
                    self.player.$node.removeClass('cwp-state-mute').addClass('cwp-state-unmute');
                }
                //if ($.cookie && self.player.options.saveVolume) {
                //    $.cookie('crown.player.volume', self.essence.volume);
                //}
            }
            //console.log('self.player.options.useSavedMuted:' + self.player.options.useSavedMuted + "  $.cookie('crown.player.muted'):" + $.cookie('crown.player.muted'));
            //if ($.cookie && self.player.options.saveMuted) {
            //    $.cookie('crown.player.muted', self.essence.isMuted);
            //}
            //}
        },
        isMouseDown = false, 
        isMouseOn = false;
        self.descendants.$volume.find('span').click(function () {
            self.essence.setIsMuted(!self.essence.getIsMuted());
        });
        self.descendants.$volume.hover(function () {
            isMouseOn = true;
            self.node_live($volumeSlider);
        }, function () {
            isMouseOn = false;
            if (!isMouseDown) {
                self.node_dead($volumeSlider);
            }
        });
        // SLIDER
        $volumeSlider.on('mousedown.surface', function (e) {
            onVolumeMove(e);
            isMouseDown = true;
            self.node_live($volumeSlider);
            return false;
        });
        var mouseUpHandler = function (e) {
            isMouseDown = false;
            if (!isMouseOn) {
                self.node_dead($volumeSlider);
            }
        };
        $(document).on('mouseup.surface', mouseUpHandler)
            .on('focusout', mouseUpHandler)
            .on('mousemove.surface', function (e) {
                if (isMouseDown) {
                    onVolumeMove(e);
                }
            });

        // listen for volume change events from other sources
        $(self.essence).on('volumechange.surface', onVolumeChange);
        setTimeout(onVolumeChange,100);
    };
    proto.build_fullscreen = function (player, options) {
        this.descendants.$fullScreen = $('<div class="cwp-button cwp-fullscreen-control"><span></span></div>')
                    .appendTo(this.controls);

        var self = this;
        this.descendants.$fullScreen.click(function () {
            self.player.setIsFullScreen(!self.player.getIsFullScreen());
        });
    };
    return Scheme;
});