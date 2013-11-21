define(['hance', 'jquery', 'domReady!'], function (hance, $) {
    var Artist = hance.inherit('crown.ui.Spinner.Artist', function () { });
    var aproto = Artist.prototype;
    aproto.init = function (element, options) {
        this._element = $(element);
        this._valueElement = $('.spinner-value');
        if (this._valueElement.length <= 0) {
            this._valueElement = $('<div class="spinner-value">0%</div>').appendTo(element);
        }
    };
    aproto.show = function () {
        this.progress(0);
        this._element.show();
    };
    aproto.hide = function () {
        this._element.hide();
    };
    aproto.progress = function (value) {
        this._valueElement.html(Math.floor(this._currentWeight / this._totalWeight * 100) + '%');
    };

    var Controller = hance.inherit("crown.ui/Spinner", function () { });
    Controller.options = {};
    var cproto = Controller.prototype;
    hance.properties(cproto, [{name:'progress', getter:true}]);
    cproto.init = function (element, options) {
        this._options = $.extend({}, Controller.options, options);
        this.artist = this._options.artist || new Artist(element, this._options);
        this._deferred = $.Deferred();
        var self = this;
        this._watchedList = [];
        this._roundCount = 0;
        this._initWeight = 50;
        this._totalWeight = this._remainWeight = 0;
        this._roundCompleted = false;
        this._isWatingMore = false;
    };
    cproto.reset = function (initWeight) {
        for (var i = 0, il = this._watchedList; i < il; i++) {
            var wa = this._watchedList[i];
            if (wa.eventName) {
                wa.off(wa.eventName, wa.handler);
            }
        }
        this._watchedList = [];
        this._roundCount++;
        this._roundCompleted = false;
        this._initWeight = initWeight || 50;
        this._totalWeight = this._remainWeight = 0;
        return this;
    };
    cproto.begin = function (initWeight) {
        //console.log('===spinner begin')
        this._deferred = $.Deferred();
        this.artist.show();
        this._isWaitingMore = true;
        return this;
    };
    cproto.push = function (weight) {
        //var ratio = this.getProgress() / 100;
        this._totalWeight += weight;
        this._remainWeight += weight;
        this._initWeight -= weight;
        //if (ratio > 0) {
        //    this._initWeight = (this._totalWeight - this._remainWeight) / ratio - this._totalWeight;
        //}
        return this;
    };
    cproto.reduce = function (weight) {
        if (!this._isWaitingMore) {
            this._initWeight -= weight * (this._initWeight / this._remainWeight);
        }
        this._remainWeight -= weight;
        this.artist.progress(this.getProgress());
        this._checkComplete();
    };
    cproto.getProgress = function () {
        var total = this._totalWeight + this._initWeight,
            loaded = this._totalWeight - this._remainWeight;
        return total > 0 ? Math.min(100, Math.floor(loaded / total * 100)) : 0;
    };
    cproto.commit = function () {
        this._isWaitingMore = false;
        var progress = this.getProgress();
        this._checkComplete();
        return this._deferred.promise();
    };
    cproto._checkComplete = function () {
        if (!this._roundCompleted && !this._isWaitingMore) {
            if (this._remainWeight <= 0) {
                this.artist.progress(100);
                this.artist.hide();
                this._roundCompleted = true;
                $(this).trigger('completed');
                this._deferred.resolve();
            }
        }
    };
    cproto.watch = function () {
        if (!this._isWaitingMore) {
            this.reset();
        }
        var args = Array.prototype.slice.call(arguments);
        for(var i = 0, il = args.length; i < il; i++){
            var arg = args[i];
            if ($.isArray(arg)) {//crown.ui component must has method getLoaded() and trigger loaded event.
                if (arg.length <= 0) {
                    continue;
                }
                var asset = arg[0];
                if (asset.done && typeof asset.done === 'function' && asset.state && typeof asset.state === 'function') {//handle $.Defferred
                    arg = { assets: arg, weight: arg.length};
                } else {
                    arg = { assets: arg, checkLoad: 'getLoaded', checkLoadParams: [], loadEventName: 'loaded error', weight: arg.length };
                }
            }
            for (var j = 0, jl = arg.assets.length; j < jl; j++) {
                var asset = arg.assets[j],
                    checkLoad = arg.checkLoad,
                    checkLoadParams = arg.checkLoadParams,
                    loadEventName = arg.loadEventName,
                    weight = arg.weight > 1 ? arg.weight / jl : 1,
                    isLoaded = false;
                if (typeof checkLoad === 'string') {
                    isLoaded = asset[checkLoad].apply(asset, checkLoadParams);
                } else if (typeof checkLoad === 'function'){
                    isLoaded = checkLoad(asset);
                } else {
                    if (asset.done && typeof asset.done === 'function' && asset.state && typeof asset.state === 'function') {
                        if (asset.state() === 'resolved' || asset.state() === 'rejected') {
                            isLoaded = true;
                        }
                    }
                }
                if (!isLoaded) {
                    this._watchAsset(asset, weight, loadEventName);
                } else {
                   // console.log('asset is loaded: ', asset);
                }
            }
        }
        if (!this._isWaitingMore && this._watchedList.length > 0) {
            console.log('====spinner will display, count: ', this._watchedList.length);
            this.begin();
        }
        return this._deferred.promise();
    };
    cproto._watchAsset = function (asset, weight, loadEventName) {
        this.push(weight);
        var self = this, roundCount = this._roundCount,
            handler = function () {
                if (roundCount !== self._roundCount) {
                    return;
                }
                self.reduce(weight);
                self._watchedList.splice(self._watchedList.indexOf(witem), 1);
            },
            witem = { asset: asset, eventName: loadEventName, handler: handler };
        if (loadEventName) {
            $(asset).one(loadEventName, handler);
        } else {
            asset.done(handler).error(handler);
        }
        this._watchedList.push(witem);
    };
    return Controller;
});