define(['jquery', 'crown', 'crown.site/Stage', 'crown.ui/Spinner', 'scripts/SpinnerArtist', 'scripts/Dialog', 'crown.ui/Picture', 'crown.browser', 'modernizr'], function ($, crown, Stage, Spinner, SpinnerArtist, Dialog, Picture, browser) {
var Scheme = crown.inherit("SiteStage", Stage);
    Scheme.options = { };
    var proto = Scheme.prototype;
    proto.init = function () {
        this.$torso = $('#torso');
        this.$wrapper = $('#wrapper');
        this.$footer = $('#wrapper>footer');
        this.$header = $('#wrapper>header');
        this.dialog = new Dialog();
        if ((browser.msie && browser.version < 11) || browser.ipad || browser.android || browser.iphone) {
            Picture.options.renderMode = 'img';
        }
        Scheme.uber.init.call(this, {enableHistory: Modernizr.history, cacheScenes:true, spinner: new Spinner(null, { artist: new SpinnerArtist() })});
        this.resolution = screen.availWidth > 960 ? 'large' : 'small';
        this.$document.on('click', 'a,.tracked-link', function () {
            var $this = $(this),
                info = eval($this.data('track-info'));
            if (info) {
                self.trackLink.apply(self, info);
            }
        });
    };
    proto.resize = function (wind, docd) {
        this.dialog.resize();
        if (this.scene) {
            this.scene.layout();
        }
    };
    proto.layout = function (wind, docd) {
        //if (this.scene) {
        //    this.scene.layout();
        //}
    };
    proto.syncPictures = function () {
        var self = this;
        $('.crown-picture').each(function () {
            var $this = $(this);
            var picture = Picture.get(this);
            if ($this.data('benches')) {
                var bs = eval($this.data('benches'));
                if (bs.indexOf(self.resolution) >= 0) {
                    var source = self.resolution == 'large' ? $this.data('source') : self.addResolutionToFileName($this.data('source'), self.resolution);
                    if (picture != null) {
                        if (picture._options.source != source) {
                            picture.build({ source: source });
                        }
                    } else {
                        if (picture == null) {
                            picture = new Picture(this, { source: source });
                        }
                    }
                } else {
                    if (picture == null) {
                        picture = new Picture(this);
                    }
                }
            } else {
                if (picture == null) {
                    picture = new Picture(this);
                }
            }
        });
    };
    proto.addResolutionToFileName = function (file, resolution) {
        var atIndex = file.lastIndexOf('@');
        var dotIndex = file.lastIndexOf('.');
        if (atIndex < 0) {
            atIndex = dotIndex;
        }
        var beforePart = file.substring(0, atIndex);
        var afterPart = file.substring(dotIndex);
        return beforePart + '@' + resolution + afterPart;
    }
    proto.trackView = function () {
    };
    proto.trackLink = function () {
    };
    proto.combinePath = function () {
        var args = Array.prototype.slice.apply(arguments), path = '';
        for (var i = 0, il = args.length; i < il; i++) {
            if (path != '' && path[path.length - 1] != '/') {
                path += '/';
            }
            var part = args[i];
            if (part && part[0] === '/' && i > 0) {
                path += part.substring(1);
            } else {
                path += part;
            }
        }
        return path;
    };
    return Scheme;
});
