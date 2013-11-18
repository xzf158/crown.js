define(['crown', 'crown.site/Scene', 'crown.ui/Picture', 'crown.browser'], function (crown, Scene, Picture, browser) {
    var Scheme = crown.inherit("scene.About", Scene);
    var proto = Scheme.prototype;
    proto.init = function () {
        Scheme.uber.init.apply(this, arguments);
    };
    proto.load = function (paper) {
        var self = this, deferred = $.Deferred();
        Scheme.uber.load.apply(this, arguments).done(function () {
            stage.syncPictures();
            stage.getSpinner().watch(Picture._instances).done(function () {
                deferred.resolve();
            });
            stage.getSpinner().commit();
        });
        return deferred.promise();
    };
    proto.enter = function (paper) {
        TweenMax.fromTo(stage.$torso[0], .8, { opacity: 0 }, { opacity: 1, ease: Quad.easeOut });
        return Scheme.uber.enter.apply(this, arguments);
    };
    proto.abort = function () {
    };
    proto.exit = function () {
        return Scheme.uber.exit.apply(this, arguments);
    };
    proto.resize = function (wind, docd) {
        if (this.scene.resize) {
            this.scene.resize();
        }
    };
    proto.layout = function () {
    };
    return Scheme;
});