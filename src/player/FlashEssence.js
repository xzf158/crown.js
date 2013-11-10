define(['require', 'jquery', 'crown', 'crown.player/utils', 'swfobject'], function (require, $, crown, utils, swfobject) {
    var Scheme = crown.inherit('crown.player.FlashEssence', function () { });
    Scheme.supportTypes = ['video/mp4', 'video/m4v', 'video/mov', 'video/flv', 'video/rtmp', 'video/x-flv', 'audio/flv', 'audio/x-flv', 'audio/mp3', 'audio/m4a', 'audio/mpeg', 'video/youtube', 'video/x-youtube'];
    Scheme._instances = [];
    Scheme.fireMediaEvent = function (id, eventName, values) {
        //console.log('==========fire event: ', eventName)
        var essence = Scheme._instances[id], e = $.Event({ type: eventName, target: essence, defaultPrevented: true });
        switch (eventName) {
            case 'timeupdate':
                e.ratio = values.currentTime / values.duration;
                break;
            case 'progress':
                e.ratio = values.bufferedTime / values.duration;
                break;
            case 'ended':
                if (essence.options.autoRewind) {
                    essence.setCurrentTime(0);
                    essence.pause();
                } else {
                    essence.setCurrentTime(0);
                    essence.pause();
                }
                break;
        }
        // attach all values to element and event object
        for (var i in values) {
            //essence['_' + i] = values[i];
            e[i] = values[i];
        }
        $(essence).trigger(e);
    };
    Scheme.flashLoaded = function (id) {
        var essence = Scheme._instances[id];
        essence.$renderer = $('#' + id);
        var renderer = essence.renderer = essence.$renderer[0];
        if (renderer._source) {
            renderer.setSource(renderer._source);
            if (essence.autoPlay) {
                renderer.playMedia();
            }
        }
        var evt = $.Event('built', { success: true });
        $(essence).trigger('built');
    };

    var proto = Scheme.prototype;
    crown.properties(proto, [{ name: 'isBuilt', getter: true, setter: false }]);
    crown.properties(proto, [{ name: 'volume', getter: true, setter: true }]);
    crown.properties(proto, [{ name: 'isMuted', getter: true, setter: false }]);
    crown.properties(proto, [{ name: 'isPaused', getter: true, setter: false }]);
    crown.properties(proto, [{ name: 'isEnded', getter: true, setter: false }]);
    crown.properties(proto, [{ name: 'isFullScreen', getter: true, setter: true }]);
    proto.build = function (node, options) {
        this._isBuilt = true;

        this.options = options;
        this.node = node;
        var $node = this.$node = $(node),
            $essence = $('<div>', {'class':'hnp-essence'}).appendTo($node),
            player = crown.fetch('crown.player');
        options.width = options.width || player.defaultVideoWidth;
        options.height = options.height || player.defaultVideoHeight;

        var flashVars = {
            'poster': options.poster, 'debug': 'false',
            'autoPlay': options.autoPlay,
            'startVolume': options.startVolume,
            'startMuted': options.startMuted,
            'preload': options.preload,
            'autoRewind': options.autoRewind
        },
        flashParams = { "allowfullscreen": "true", "quality": "high", "wmode":"transparent", "swliveconnect": "true", "bgcolor": "#000000", allowScriptAccess: 'always' },
        flashAttributes = { "class": "hnp-renderer" },
        elementId = this.elementId = "hnp-renderer-" + crown.fetch('crown.player.MediaPlayer').playerIndex,
        self = this;
        Scheme._instances[elementId] = this;
        $('<div>', { id: elementId, "class": "hnp-renderer" }).appendTo($essence)
            .append('<p class="hnp-get-flash"><a target="_blank" href="http://www.adobe.com/go/getflashplayer">' + 
                '<img src="https://www.adobe.com/macromedia/style_guide/images/160x41_Get_Flash_Player.jpg" ' + 
                'alt="Get Adobe Flash player" /></a></p>');
        swfobject.embedSWF(require.toUrl('./flash/FlashMediaElement.swf') + '?_t=' + (new Date().getTime()),
            elementId,
            '100%', '100%', '10.0.0',
            require.toUrl('./flash/expressInstall.swf'),
            flashVars, flashParams, flashAttributes, function (e) {
                if (!e.success) {
                    var evt = $.Event('built', {fail:true});
                    $(self).trigger(evt);
                }
            });
        $node.css({ width: options.width, height: options.height });
        $(window).resize(function () {
            self.layout();
        });
    };
    //function combinePath() {
    //    var args = Array.prototype.slice.apply(arguments), path = '';
    //    for (var i = 0, il = args.length; i < il; i++) {
    //        if (path != '' && path[path.length - 1] != '/') {
    //            path += '/';
    //        }
    //        var part = args[i];
    //        console.log('part: ' + part)
    //        if (part && part[0] === '/' && i > 0) {
    //            path += part.substring(1);
    //        } else {
    //            path += part;
    //        }
    //    }
    //    return path;
    //}
    proto.canPlayType = function (type) {
        return Scheme.supportTypes.indexOf(type) >= 0;
    };
    proto.setSource = function (src) {
        if (this._source && this.renderer) {
            this.renderer.stopMedia();
        }
        //console.log(utils.absolutizeUrl)
        this._source = utils.absolutizeUrl(src);
        if (this._source && this.renderer) {
            this.renderer.setSource(this._source);
        }
    };
    proto.load = function () {
        if (this.renderer) {
            this.renderer.load();
        }
    };
    proto.play = function () {
        if (this.renderer) {
            this.renderer.playMedia();
        }
    };
    proto.stop = function () {
        if (this.renderer) {
            this.renderer.stopMedia();
        }
    };
    proto.pause = function () {
        if (this.renderer) {
            this.renderer.pauseMedia();
        }
    };
    proto.seek = function (time) {
        if (this.renderer) {
            this.renderer.setCurrentTime(time);
        }
    };
    proto.getDuration = function () {
        if (this.renderer) {
            return this.renderer.getDuration();
        }
    };
    proto.getVolume = function () {
        if (this.renderer) {
            return this.renderer.getVolume();
        }
    };
    proto.setVolume = function (vol) {
        if (this.renderer) {
            this.renderer.setVolume(vol);
        }
    };
    proto.getCurrentTime = function () {
        if (this.renderer) {
            return this.renderer.getCurrentTime();
        }
    };
    proto.setCurrentTime = function (time) {
        if (this.renderer) {
            this.renderer.setCurrentTime(time);
        }
    };
    proto.setIsMuted = function (m) {
        if (this.renderer) {
            this.renderer.setIsMuted(m);
        }
    };
    proto.buffered = function () {
    };
    proto.getIsMuted = function () {
        if (this.renderer) {
            return this.renderer.getIsMuted();
        }
    };
    proto.getIsPaused = function () {
        if (this.renderer) {
            return this.renderer.getIsPaused();
        }
    };
    proto.getIsEnded = function () {
        if (this.renderer) {
            return this.renderer.getIsEnded();
        }
    };
    proto.layout = function () {
        //this.renderer.setVideoSize(this.$renderer.width(), this.$renderer.height());
    };
    proto.collapse = function () {
        this.$renderer.remove();
        this.renderer = null;
        this.options = null;
        this._isBuilt = false;
    };
    proto.dispose = function () {
        delete Scheme._instances[this.elementId];
    };

    return Scheme;
});
