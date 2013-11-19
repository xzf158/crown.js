define(['crown', 'jquery', 'domReady!'], function (crown, $) {
    var Scheme = crown.inherit("crown.site.Curtain", function () { });
    var proto = Scheme.prototype;
    crown.properties(proto, [
    ]);
    proto.init = function (options) {
        this._queue = [];
    };
    proto.push = function(zone, phase){
        this._queue.push({zone:zone, phase:phase});
    };
    proto.build = function(){

    };
    proto.shift = function () {
    };
    return Scheme;
});

//{zone:'zonename', delay:10, phase:'enter', after:{zone:'zname', phase:'enter'}}