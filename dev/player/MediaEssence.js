define(['jquery', 'hance', 'crown/player/utils'], function($, crown, utils) {
    var Scheme = hance.inherit('crown.player.MediaEssence', function() {});
    //Scheme.supportTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/wmv'];
    var proto = Scheme.prototype;
    hance.properties(proto, [{
        name: 'isBuilt',
        getter: true,
        setter: false
    },{
        name: 'volume',
        getter: true,
        setter: true
    },{
        name: 'isMuted',
        getter: true,
        setter: false
    },{
        name: 'isPaused',
        getter: true,
        setter: false
    },{
        name: 'isEnded',
        getter: true,
        setter: false
    },{
        name: 'isRewinding',
        getter: true,
        setter: false
    },{
        name: 'isFullScreen',
        getter: true,
        setter: true
    },{
        name: 'isVideo',
        getter: true,
        setter: false
    },{
        name: 'isAudio',
        getter: true,
        setter: false
    },{
        name: 'currentTime',
        getter: true,
        setter: true
    }]);
    proto.build = function(node, options) {
        this._isBuilt = true;

        this.options = options;
        var tracks = this.tracks = options.tracks;
        var captions = this.captions = [];
        var chapters = this.chapters = [];
        this.node = node;
        var $node = this.$node = $(node);
        var $renderer = this.$renderer = $('<div class="hnp-essence"><video class="hnp-renderer"></video></div>').appendTo($node).find('video');
        var renderer = this.renderer = $renderer[0];
        var self = this,
            $self = $(this);

        if (options.loop) {
            $renderer.attr('loop', 'loop');
        }
        if (options.autoPlay) {
            //$renderer.attr('autoplay', 'autoplay');
            renderer.play();
        }
        if (options.autoBuffer) {
            $renderer.attr('autobuffer', 'autobuffer');
        }
        if (options.preload) {
            $renderer.prop('preload');
        } else {
            $renderer.attr('preload', 'none');
        }
        if (options.poster) {
            $renderer.attr('poster', options.poster);
        } else {
            $renderer.removeAttr('poster');
        }

        options.width = options.width || crown.fetch('crown.player').defaultVideoWidth;
        options.height = options.height || crown.fetch('crown.player').defaultVideoHeight;

        //$renderer.attr({ width: options.width, height: options.height });
        if (this.tracks) {
            for (var i = 0, il = this.tracks.length; i < il; i++) {
                var track = this.tracks[i];
                var $track = $('<track></track>');
                $renderer.append($track);
                $track.attr('src', track.src);
                if (track.kind) {
                    $track.attr('kind', track.kind);
                }
                if (track.srclang) {
                    $track.attr('srclang', track.srclang);
                }
                if (track.label) {
                    $track.attr('label', track.label);
                }
                if (track['default']) {
                    $track.attr('default', track['default']);
                }

                if (track.kind === 'subtitles') {
                    this.captions.push(track);
                } else if (track.kind === 'chapters') {
                    this.chapters.push(track);
                }
            }
        }

        //if (options.enableAutosize) {
        //    renderer.addEventListener('loadedmetadata', function (e) {
        //        $renderer.attr({ width: e.target.videoWidth, height: e.target.videoHeight });
        //        $node.css({ 'width': options.width, 'height': options.height });
        //    }, false);
        //}

        //$node.css({ 'width': options.width, 'height': options.height });
        $self.trigger($.Event({
            type: 'built',
            defaultPrevented: true
        }));

        var listener = function(e) {
            var ne = null;
            //console.log(e.type)
            switch (e.type) {
                case 'timeupdate':
                    ne = $.Event({
                        type: e.type,
                        defaultPrevented: true
                    }, {
                        ratio: e.target.currentTime / e.target.duration
                    });
                    $self.trigger(ne);
                    break;
                case 'progress':
                    ne = $.Event({
                        type: e.type,
                        defaultPrevented: true
                    });
                    var target = ne.target = e.target;

                    // newest HTML5 spec has buffered array (FF4, Webkit)
                    if (target && target.buffered && target.buffered.length > 0 && target.buffered.end && target.duration) {
                        // TODO: account for a real array with multiple values (only Firefox 4 has this so far)
                        ne.ratio = target.buffered.end(0) / target.duration;
                    }
                    // Some browsers (e.g., FF3.6 and Safari 5) cannot calculate target.bufferered.end()
                    // to be anything other than 0. If the byte count is available we use this instead.
                    // Browsers that support the else if do not seem to have the bufferedBytes value and
                    // should skip to there. Tested in Safari 5, Webkit head, FF3.6, Chrome 6, IE 7/8.
                    else if (target && target.bytesTotal !== undefined && target.bytesTotal > 0 && target.bufferedBytes !== undefined) {
                        ne.ratio = target.bufferedBytes / target.bytesTotal;
                    }
                    // Firefox 3 with an Ogg file seems to go this way
                    else if (e.lengthComputable && e.total !== 0) {
                        ne.ratio = e.loaded / e.total;
                    }
                    ne.preventDefault();
                    $self.trigger(ne);
                    break;
                case 'ended':
                    ne = $.Event({
                        type: e.type,
                        defaultPrevented: true
                    });
                    $self.trigger(ne);
                    if (self.options.autoRewind) {
                        self.setCurrentTime(0);
                        self.pause();
                        //self._isRewinding = false;
                    }
                    break;
                case 'canplaythrough':
                    console.log('canplaythrough');
                    self._canSeek = true;
                    break;
                default:
                    ne = $.Event({
                        type: e.type,
                        defaultPrevented: true
                    });
                    $self.trigger(ne);
                    break;
            }
        };
        var events = ['play', 'playing', 'ended', 'seeking', 'pause', 'loadeddata', 'loadstart', 'canplay', 'canplaythrough', 'waiting', 'timeupdate', 'progress', 'volumechange', 'loadedmetadata'];
        for (var i = 0, il = events.length; i < il; i++) {
            renderer.addEventListener(events[i], listener, false);
        }
    };
    proto.canPlayType = function(type) {
        return utils.platform.nativeCanPlayType(type);
    };
    proto.setSource = function(src) {
        this._source = src;
        var $renderer = this.$renderer;
        var $source = $renderer.find('source');
        var type = utils.getTypeFromFile(src);
        var extension = utils.getExtension(src);
        if (type.indexOf('audio') >= 0) {
            this._isAudio = true;
            this._isVideo = false;
        } else {
            this._isAudio = false;
            this._isVideo = true;
        }
        this.stop();
        //console.log('=============set player src:', src)
        if ($source.length === 0) {
            ///console.log('=============src:', src)
            $renderer.append('<source src="' + src + '" type="' + type + '" />');
            if ($renderer.find('source').length === 0) { //why ie9 can not add source element?
                $renderer.attr({
                    src: src,
                    type: type
                });
            }
        } else {
            $source.attr({
                src: src,
                type: type
            });
        }
    };
    proto.load = function() {
        this.renderer.load();
    };
    proto.play = function() {
        this.renderer.play();
    };
    proto.stop = function() {
        $(this).trigger('stop');
        this.seek(0);
        this.renderer.pause();
    };
    proto.pause = function() {
        this.renderer.pause();
    };
    proto.seek = function(time) {
        if (this._canSeek) {
            this.renderer.currentTime = time;
        }
    };
    proto.getDuration = function() {
        return this.renderer.duration || 0;
    };
    proto.getVolume = function() {
        return this.renderer.volume;
    };
    proto.setVolume = function(vol) {
        if (vol !== this.renderer.volume) {
            this.renderer.volume = vol;
        }
    };
    proto.getCurrentTime = function() {
        return this.renderer.currentTime || 0;
    };
    proto.setCurrentTime = function(time) {
        if (this._canSeek) {
            this.renderer.currentTime = time;
        }
    };
    proto.setIsMuted = function(m) {
        this.renderer.muted = m;
    };
    proto.buffered = function() {
        var percent = 0,
            renderer = this.renderer;
        // newest HTML5 spec has buffered array (FF4, Webkit)
        if (renderer && renderer.buffered && renderer.buffered.length > 0 && renderer.buffered.end && renderer.duration) {
            // TODO: account for a real array with multiple values (only Firefox 4 has this so far)
            percent = renderer.buffered.end(0) / renderer.duration;
        }
        // Some browsers (e.g., FF3.6 and Safari 5) cannot calculate renderer.bufferered.end()
        // to be anything other than 0. If the byte count is available we use this instead.
        // Browsers that support the else if do not seem to have the bufferedBytes value and
        // should skip to there. Tested in Safari 5, Webkit head, FF3.6, Chrome 6, IE 7/8.
        else if (renderer && renderer.bytesTotal !== undefined && renderer.bytesTotal > 0 && renderer.bufferedBytes !== undefined) {
            percent = renderer.bufferedBytes / renderer.bytesTotal;
        }
        return Math.min(1, Math.max(0, percent));
    };
    proto.getIsMuted = function() {
        return this.renderer.muted;
    };
    proto.getIsPaused = function() {
        return this.renderer.paused;
    };
    proto.getIsEnded = function() {
        return this.renderer.ended;
    };
    proto.layout = function() {

    };
    proto.collapse = function() {
        this.$renderer.remove();
        this.$renderer = null;
        this.renderer = null;
        this.options = null;
        this._isBuilt = false;
        this.removeAllEventListeners();
    };
    proto.dispose = function() {};
    return Scheme;
});
