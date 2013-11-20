define(['hance'], function (hance) {
    var Scheme = hance.inherit("crown.site.CacheManager", function () { });
    var proto = Scheme.prototype;
    hance.properties(proto, [
    ]);
    proto.init = function (options) {
        this._cachedObjects = {};
    };
    proto.push = function (key, value) {
        this._cachedObjects[key] = value;
    };
    proto.fetch = function (key) {
        return this._cachedObjects[key];
    };
    return Scheme;
});