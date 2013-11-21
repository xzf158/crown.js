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
    proto.push = function(zone, action, args){
        this._queue.push({zone:zone, action:action, args:args});
    };
    proto.build = function(){

    };
    proto.shift = function () {
        console.log('====shift');
        this._queue.sort(function(a, b){
            if (a.action === b.action){
                return 0;
            }else if (a.action === 'enter'){
                return -1;
            }else if (a.action === 'exit'){
                return 1;
            }
        });
        for(var i = 0, il = this._queue.length; i < il; i++){
            var item = this._queue[i];
            item.zone[item.action].apply(item.zone, item.args);
        }
        this._queue = [];
    };
    return Scheme;
});

//{zone:'zonename', delay:10, phase:'enter', after:{zone:'zname', phase:'enter'}}