define(['crown', 'jquery', 'domReady!'], function (crown, $) {
    var Scheme = crown.inherit("crown.site.Curtain", function () { });
    var proto = Scheme.prototype;
    crown.properties(proto, [
    ]);
    proto.init = function (options) {
    };
    proto.shift = function (paper, oldScene, newScene, state) {
        oldScene.exit();
        newScene.enter(paper);
    };
    return Scheme;
});