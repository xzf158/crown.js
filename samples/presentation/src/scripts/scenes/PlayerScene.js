define(['jquery', 'crown', 'crown.site/Scene', 'crown.player/MediaPlayer', 'crown.player/surfaces/classic/surface', 'crown.browser'
    ], function ($, crown, Scene, MediaPlayer, PlayerClassicSurface, browser) {
    var Scheme = crown.inherit("scene.BasicScene", Scene);
    var proto = Scheme.prototype;
    proto.init = function () {
        Scheme.uber.init.call(this, {combineZones:true});
    };
    proto.load = function (paper) {
        var self = this, deferred = $.Deferred();
        Scheme.uber.load.apply(this, arguments).done(function () {
            deferred.resolve();
        });
        stage.getSpinner().commit();
        return deferred.promise();
    };
    proto.enter = function (paper) {
        //  var player = new MediaPlayer($pele[0], {
        //             poster: posterUrl,
        //             sources: [sourceName + '.mp4', sourceName + '.webm'],
        //             startVolume: 1,
        //             surface: PlayerClassicSurface,
        //             theme: 'default',
        //             width: '100%',
        //             height: '100%',
        //             preload: false,
        //             features: ['overlay', 'play', 'current', 'scrubber', 'duration', 'volume', 'fullscreen']
        // });
        return Scheme.uber.enter.apply(this, arguments);
    };
    proto.abort = function () {
    };
        
    proto.setActiveZone = function (zone) {
        Scheme.uber.setActiveZone.apply(this, arguments);
    };
    /*
    proto.exit = function () {
        $('#scene-video').remove();
        return $.Deferred().resolve();
    };*/
    proto.resize = function (wind, docd) {
        if (this._scene.resize) {
            this._scene.resize();
        }
    };
    proto.layout = function () {
    };
    return Scheme;
});