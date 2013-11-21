define(['jquery', 'hance', 'crown/player/utils', 'crown/player/MediaEssence', 'crown/player/FlashEssence'], function ($, hance, utils, MediaEssence, FlashEssence) {
    var Scheme = hance.inherit('crown.player.MediaPlayer', function () { });
    Scheme.playerIndex = 0;
    Scheme.essences = [MediaEssence, FlashEssence];
    var proto = Scheme.prototype;
    hance.properties(proto, [{ name: 'sources', getter: true, setter: true }]);
    hance.properties(proto, [{ name: 'isFullScreen', getter: true, setter: true }]);
    Scheme.options = {
        poster: "",
        surface: "classic",
        theme: "default",
        sources: undefined,
        tracks: undefined,
        preload: 'none',
        loop: false,
        autoPlay: false,
        autoBuffer: false,
        autoRewind: true,
        //idleHideControls: false,
        currentMeidaIndex: 0,
        startVolume: 0.8,
        saveVolume: true,
        useSavedVolume: true,
        startMuted: false,
        saveMuted: true,
        useSavedMuted: true,
        enableAutosize: false,
        autosizeProgress: true,
        alwaysShowControls: false,
        iPadUseNativeControls: false,
        iPhoneUseNativeControls: true,
        androidUseNativeControls: true,
        enableKeyboard: true,
        pauseOtherPlayers: true,
        features: ['overlay', 'spinner', 'play', 'scrubber', 'time', 'track', 'volume', 'fullscreen'],
        keyActions: [
            {
                keys: [
                        32, // SPACE
                        179 // GOOGLE play/pause button
                ],
                action: function (player, essense) {
                    if (essense.getIsPaused() || essense.getIsEnded()) {
                        essense.play();
                    } else {
                        essense.pause();
                    }
                }
            },
            {
                keys: [38], // UP
                action: function (player, essense) {
                    var newVolume = Math.min(essense.getVolume() + 0.1, 1);
                    essense.setVolume(newVolume);
                }
            },
            {
                keys: [40], // DOWN
                action: function (player, essense) {
                    var newVolume = Math.max(essense.getVolume() - 0.1, 0);
                    essense.setVolume(newVolume);
                }
            },
            {
                keys: [
                        37, // LEFT
                        227 // Google TV rewind
                ],
                action: function (player, essense) {
                    if (!isNaN(essense.duration) && essense.duration > 0) {
                        if (player.isVideo) {
                            player.showControls();
                            player.startControlsTimer();
                        }

                        // 5%
                        var newTime = Math.max(essense.getCurrentTime() - player.options.defaultSeekBackwardInterval(essense), 0);
                        player.setCurrentTime(newTime);
                    }
                }
            },
            {
                keys: [
                        39, // RIGHT
                        228 // Google TV forward
                ],
                action: function (player, essense) {
                    if (!isNaN(essense.duration) && essense.duration > 0) {
                        if (player.isVideo) {
                            player.showControls();
                            player.startControlsTimer();
                        }

                        // 5%
                        var newTime = Math.min(essense.getCurrentTime() + player.options.defaultSeekForwardInterval(essense), essense.getDuration());
                        player.setCurrentTime(newTime);
                    }
                }
            },
            {
                keys: [70], // f
                action: function (player, essense) {
                    if (typeof player.enterFullScreen !== 'undefined') {
                        if (player.isFullScreen) {
                            player.exitFullScreen();
                        } else {
                            player.enterFullScreen();
                        }
                    }
                }
            }
        ]
    };
    proto.init = function (node, options) {
        options = $.extend({}, Scheme.options, options);
        this.node = node;
        this.$node = $(this.node).html('').addClass('cwp-state-unfullscreen');

        this.essences = [];
        var self = this;
        for (var i = 0, il = Scheme.essences.length; i < il; i++) {
            this.essences.push(new Scheme.essences[i]());
        }
        if (utils.platform.hasTrueNativeFullScreen) {
            this.getIsFullScreen = function () {
                if (node.mozRequestFullScreen) {
                    return document.mozFullScreen;
                } else if (node.webkitRequestFullScreen) {
                    return document.webkitIsFullScreen;
                }
            };

            this.requestFullScreen = function (el) {
                if (utils.platform.hasWebkitNativeFullScreen) {
                    el.webkitRequestFullScreen();
                } else if (utils.platform.hasMozNativeFullScreen) {
                    el.mozRequestFullScreen();
                }
                $('html').addClass('fullscreen');
            };

            this.cancelFullScreen = function () {
                if (utils.platform.hasWebkitNativeFullScreen) {
                    document.webkitCancelFullScreen();
                } else if (utils.platform.hasMozNativeFullScreen) {
                    document.mozCancelFullScreen();
                }
                $('html').removeClass('fullscreen');
            };

            var fullscreenHandler = function (e) {
                self._isFullScreen = self.getIsFullScreen();
                self.fullScreenSize(self._isFullScreen);
                self.surface.layout();
                $(self).trigger({ type: self._isFullScreen ? 'fullscreen' : 'unfullscreen', defaultPrevented: true });
            };
            if (utils.platform.hasMozNativeFullScreen) {
                $(window).on(utils.platform.fullScreenEventName, fullscreenHandler);
            } else {
                this.$node.on(utils.platform.fullScreenEventName, fullscreenHandler);
            }
        }

        this.build(node, options);
    };
    proto.build = function (node, options) {
        this.options = options;
        this.tracks = options.tracks;
        this.captions = [];
        this.chapters = [];

        this.width = options.width;
        this.height = options.height;
        this.$node.css({ width: this.width, height: this.height });
        this.setSources(options.sources);
        Scheme.playerIndex++;
    };
    proto.rebuild = function (options) {
        this.collapse();
        this.build(options);
    };
    proto.setSources = function (srcs) {
        /*
        if (srcs.indexOf(this._usedSource) >= 0) {
            return;
        }
        if (this.essence){
            this.stop();
        }*/
        this._sources = srcs;
        var currentVolume = this.essence ? this.essence.getVolume() : this.options.startVolume,
            self = this;
        var afterEssenceBuilt = function (e) {
            if (self.options.surface && this.surface === undefined) {
                if (typeof self.options.surface === 'string') {
                    utils.require(['crown/player/surfaces/' + self.options.surface + '/surface'], function (Surface) {
                        self.surface = new Surface(self, self.options);
                        self.$node.addClass(self.surface.cssClass).addClass('cwp-theme-' + this.options.theme);
                        if (e.fail) {
                            return;
                        }
                        self.surface.build();
                        self.surface.ready();
                        self.setSources(self._sources);
                        self.setVolume(currentVolume);
                        self.setIsMuted(self.options.startMuted === undefined ? false : self.options.startMuted);
                    });
                } else {
                    self.surface = new self.options.surface(self, self.options);
                    this.$node.addClass(self.surface.cssClass).addClass('cwp-theme-' + this.options.theme);
                    if (e.fail) {
                        return;
                    }
                    self.surface.build();
                    self.surface.ready();
                    self.setSources(self._sources);
                    self.setVolume(currentVolume);
                    self.setIsMuted(self.options.startMuted === undefined ? false : self.options.startMuted);
                }
            } else {
                if (e.fail) {
                    return;
                }
                self.setSources(self._sources);
                self.setVolume(currentVolume);
                self.setIsMuted(self.options.startMuted === undefined ? false : self.options.startMuted);
            }
            $(self.essence).on('play', function () { self.isPlay = true; }).on('playing', function () { self.isPlaying = true; });
        };

        for (var i = 0, il = this.essences.length; i < il; i++) {
            var essence = this.essences[i], found = false;
            for (var j = 0, jl = this._sources.length; j < jl; j++) {
                var source = this._sources[j];
                if (essence.canPlayType(utils.getTypeFromFile(source))) {
                    if (this.essence !== essence) {
                        if (this.essence) {
                            this.essence.collapse();
                        }
                        this.essence = essence;
                        this._usedSource = source;
                        if (!this.essence.getIsBuilt()) {
                            $(this.essence).one('built', afterEssenceBuilt);
                            this.essence.build(this.node, this.options);
                        } else {
                            this.essence.setSource(this._usedSource);
                        }
                    } else {
                        this._usedSource = source;
                        this.essence.setSource(this._usedSource);
                    }
                    found = true;
                    break;
                }
            }
            if (found) {
                break;
            }
        }
    };
    proto.getIsFullScreen = function () {
        return this.essence.getIsFullScreen();
    };
    proto.onFullScreenEscKeyDown = function (e) {
        if (e.keyCode === 27) {
            this.setIsFullScreen(false);
        }
    };
    proto.setIsFullScreen = function (f) {
        var self = this;
        self._isFullScreen = f;
        if (self._isFullScreen) {
            if (utils.platform.hasTrueNativeFullScreen) {
                self.requestFullScreen(self.node);
            } else if (utils.platform.hasSemiNativeFullScreen) {
                this.essence.renderer.webkitEnterFullscreen();
                return;
            } else {
                // Add listener for esc key to exit fullscreen
                $(document).on('keydown', $.proxy(self, 'onFullScreenEscKeyDown'));
            }
        } else {
            if (self.cancelFullScreen) {
                self.cancelFullScreen();
            } else {
                $(document).off('keydown', $.proxy(self, 'onFullScreenEscKeyDown'));
            }
        }
        if (!utils.platform.hasTrueNativeFullScreen) {
            this.fullScreenSize(f);
            this.surface.layout();
            this.essence.setIsFullScreen(f);
            $(this).trigger($.Event({ type: f ? 'fullscreen' : 'unfullscreen', defaultPrevented: true }));
        }
    };
    proto.fullScreenSize = function (f) {
        var $document = $(document);
        //console.log('***********************:', f)
        if (f) {
            if (this._docOrigDataStored) {
                return;//avoid to store data twice, I do not want to store data after fullscreen.
                //Storing original doc overflow value to return to when fullscreen is off
                //console.log('Storing original doc overflow value to return to when fullscreen is off');
            }
            this.docOrigOverflow = document.documentElement.style.overflow;
            this.docOrigScrollTop = $document.scrollTop();
            this.docOrigScrollLeft = $document.scrollLeft();
            this.nodeOrigWidth = this.$node[0].style.getPropertyValue != null ? this.$node[0].style.getPropertyValue("width") : this.$node[0].style.getAttribute("width");
            this.nodeOrigHeight = this.$node[0].style.getPropertyValue != null ? this.$node[0].style.getPropertyValue("height") : this.$node[0].style.getAttribute("height");
            $document.css('overflow', 'hidden');
            this.$node.css({ width: '', height: '' });
            this.$node.removeClass('cwp-state-unfullscreen').addClass('cwp-state-fullscreen');
            $('html').removeClass('unfullscreen').addClass('fullscreen');
            this._docOrigDataStored = true;
        } else {
            document.documentElement.style.overflow = this.docOrigOverflow;
            $document.scrollTop(this.docOrigScrollTop);
            $document.scrollLeft(this.docOrigScrollLeft);
            this.$node.css({ width: this.nodeOrigWidth, height: this.nodeOrigHeight });
            this.$node.removeClass('cwp-state-fullscreen').addClass('cwp-state-unfullscreen');
            $('html').removeClass('fullscreen').addClass('unfullscreen');
            this._docOrigDataStored = false;
        }
    };
    proto.getIsMuted = function () {
        return this.essence.getIsMuted();
    };
    proto.setIsMuted = function (m) {
        this.essence.setIsMuted(m);
    };
    proto.load = function () {
        this.essence.load();
    };
    proto.play = function () {
        this.essence.play();
    };
    proto.stop = function () {
        this.essence.stop();
    };
    proto.pause = function () {
        this.essence.pause();
    };
    proto.seek = function (time) {
        this.essence.seek(time);
    };
    proto.buffered = function () {
        return this.essence.buffered();
    };
    proto.getDuration = function () {
        return this.essence.getDuration();
    };
    proto.getVolume = function () {
        return this.essence.getVolume();
    };
    proto.setVolume = function (vol) {
        return this.essence.setVolume(vol);
    };
    proto.layout = function () {
        if (this.essence && this.essence.layout) {
            this.essence.layout();
        }
        if (this.surface && this.surface.layout) {
            this.surface.layout();
        }
    };
    proto.collapse = function () {
        this.$renderer.remove();
        this.renderer = null;
        this.options = null;
        this._isBuilt = false;
    };
    proto.dispose = function () {
        this.stop();
        if (this.essence.dispose) {
            this.essence.dispose();
        }
        if (this.surface.dispose) {
            this.surface.dispose();
        }
    };
    return Scheme;
});