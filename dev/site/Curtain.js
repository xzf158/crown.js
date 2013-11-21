define(['hance', 'jquery', 'domReady!'], function (hance, $) {
    var Scheme = hance.inherit("crown.site.Curtain", function () { });
    var proto = Scheme.prototype;
    hance.properties(proto, [
    ]);
    proto.init = function (options) {
        this._queue = [];
    };
    proto.clean = function(){
        this._queue = [];
    };
    proto.push = function(zone, phase){
        this._queue.push({zone:zone, phase:phase});
    };
    proto.build = function(){

    };
    proto.shift = function () {
        this._queue = [];
    };
    return Scheme;
});

//{zone:'zonename', delay:10, phase:'enter', after:{zone:'zname', phase:'enter'}}