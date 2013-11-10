define(['jquery', 'crown'], function ($, crown) {
    var ua = window.navigator.userAgent.toLowerCase();
    var Scheme = crown.inherit('crown.player.utils', {
        require:window.require||window.curl,
        platform: {
            isiPad: ua.match(/ipad/i),
            isiPhone: ua.match(/iphone/i),
            isiOS:  ua.match(/ipad/i) || ua.match(/iphone/i),
            isAndroid: ua.match(/android/i),
            isBustedAndroid: ua.match(/android 2\.[12]/),
            isIE: window.navigator.appName.indexOf("Microsoft") !== -1,
            isChrome: ua.match(/Chrome/gi),
            isFirefox: ua.match(/firefox/gi),
            isWebkit: ua.match(/webkit/gi),
            isGecko: ua.match(/gecko/gi) && this.isWebkit,
            isOpera: ua.match(/opera/gi),
            hasTouch: ('ontouchstart' in window),
            supportsSvg: !!document.createElementNS &&
                !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect
        },
        encodeUrl: function (url) {
            return encodeURIComponent(url); //.replace(/\?/gi,'%3F').replace(/=/gi,'%3D').replace(/&/gi,'%26');
        },
        escapeHTML: function (s) {
            return s.split('&').join('&amp;').split('<').join('&lt;').split('"').join('&quot;');
        },
        absolutizeUrl: function (url) {
            var el = document.createElement('div');
            el.innerHTML = '<a href="' + this.escapeHTML(url) + '">x</a>';
            return el.firstChild.href;
        },
        secondsToTimeCode: function (seconds) {
            seconds = Math.round(seconds);
            var minutes = Math.floor(seconds / 60);
            minutes = (minutes >= 10) ? minutes : "0" + minutes;
            seconds = Math.floor(seconds % 60);
            seconds = (seconds >= 10) ? seconds : "0" + seconds;
            return minutes + ":" + seconds;
        },
        getExtension: function (file) {
            return file.substring(file.lastIndexOf(".") + 1);
        },
        formatType: function (url, type) {
            var ext;

            // if no type is supplied, fake it with the extension
            if (url && !type) {
                return this.getTypeFromFile(url);
            } else {
                // only return the mime part of the type in case the attribute contains the codec
                // see http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html#the-source-element
                // `video/mp4; codecs="avc1.42E01E, mp4a.40.2"` becomes `video/mp4`
                if (type && ~type.indexOf(';')) {
                    return type.substr(0, type.indexOf(';'));
                } else {
                    return type;
                }
            }
        },

        getTypeFromFile: function (url) {
            url = url.split('?')[0];
            var ext = url.substring(url.lastIndexOf('.') + 1);
            return (/(mp4|m4v|ogg|ogv|webm|webmv|flv|wmv|mpeg|mov)/gi.test(ext) ? 'video' : 'audio') + '/' + this.getTypeFromExtension(ext);
        },

        getTypeFromExtension: function (ext) {
            switch (ext) {
                case 'mp4':
                case 'm4v':
                    return 'mp4';
                case 'webm':
                case 'webma':
                case 'webmv':
                    return 'webm';
                case 'ogg':
                case 'oga':
                case 'ogv':
                    return 'ogg';
                default:
                    return ext;
            }
        }
    });

    var platform = Scheme.platform, audioElement = document.createElement('audio'), videoElement = document.createElement('video');
    if (platform.isBustedAndroid){
        videoElement.canPlayType = function (type) {
            return type.match(/video\/(mp4|m4v)/gi) ? 'maybe' : '';
        };
    }
    platform.supportsMediaTag = (typeof videoElement.canPlayType !== 'undefined' || Scheme.platform.isBustedAndroid);
    // detect native JavaScript fullscreen (Safari/Firefox only, Chrome still fails)

    // iOS
    platform.hasSemiNativeFullScreen = (typeof videoElement.webkitEnterFullscreen !== 'undefined');

    // Webkit/firefox
    platform.hasWebkitNativeFullScreen = (typeof videoElement.webkitRequestFullScreen !== 'undefined');
    platform.hasMozNativeFullScreen = (typeof videoElement.mozRequestFullScreen !== 'undefined');
    platform.hasMSNativeFullScreen = (typeof videoElement.msRequestFullscreen !== 'undefined');

    platform.hasTrueNativeFullScreen = (platform.hasWebkitNativeFullScreen || platform.hasMozNativeFullScreen || platform.hasMSNativeFullScreen);
    platform.nativeFullScreenEnabled = platform.hasTrueNativeFullScreen;
    if (platform.hasMozNativeFullScreen) {
        platform.nativeFullScreenEnabled = videoElement.mozFullScreenEnabled;
    }

    if (platform.isChrome) {
        platform.hasSemiNativeFullScreen = false;
    }

    if (platform.hasTrueNativeFullScreen) {
        if (platform.hasWebkitNativeFullScreen) {
            platform.fullScreenEventName = 'webkitfullscreenchange';
        } else if (platform.hasMozNativeFullScreen) {
            platform.fullScreenEventName = 'mozfullscreenchange';
        } else if (platform.hasMSNativeFullScreen) {
            platform.fullScreenEventName = 'msfullscreenchange';
        } else {
            platform.fullScreenEventName = 'fullscreenchange';
        }
    }

    // OS X 10.5 can't do this even if it says it can :(
    if (platform.hasSemiNativeFullScreen && ua.match(/mac os x 10_5/i)) {
        platform.hasNativeFullScreen = false;
        platform.hasSemiNativeFullScreen = false;
    }
    platform.nativeCanPlayType = function (type) {
        return (videoElement.canPlayType && videoElement.canPlayType(type).replace(/no/, '') !== '') || (audioElement.canPlayType && audioElement.canPlayType(type).replace(/no/, '') !== '');
    };
    return Scheme;
});