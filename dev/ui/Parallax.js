define(['hance', 'jquery', 'greensock/TweenMax'], function (hance, $) {
    var Scheme = crown.inherit("crown.ui.Parallax", function () { });

    var proto = Scheme.prototype;
    proto.init = function () {
        this._items = [];
    };
    proto.add = function (element, options) {
        var stones = options.stones, spot = options.spot || 0, ranges = [], min = spot, max = spot;
        for (var i = 0, il = stones.length; i < il; i++) {
            var currentStone = stones[i];
            if (currentStone.ratio === spot) {
                if (currentStone.vars) {
                    TweenLite.set(element, currentStone.vars);
                }
                continue;
            }

            var prevStone = (i === 0 ? null : stones[i - 1]), nextStone = (i === il - 1 ? null : stones[i+1]);
            if (currentStone.vars === undefined) {
                currentStone.vars = {};
            }
            currentStone.vars.paused = true;
            var range = { tween: new TweenLite(element, 1, currentStone.vars) };
            if (currentStone.ratio > spot) {
                range.start = (prevStone == null || prevStone.ratio < spot) ? spot : prevStone.ratio;
                range.end = currentStone.ratio;
            }else{
                range.start = (nextStone == null || nextStone.ratio > spot) ? spot : nextStone.ratio;
                range.end = currentStone.ratio;
            }
            //console.log('????????????currentStone.ratio:', currentStone.ratio, '    min:', min, '   ', currentStone.ratio < min)
            if (currentStone.ratio < min) {
                min = currentStone.ratio;
            }
            if (currentStone.ratio > max) {
                max = currentStone.ratio;
            }
            ranges.push(range);
        }
        //console.log('==========:', spot, '               ', min, '        ' ,max)
        this._items.push($.extend({}, options, { element: element, ranges: ranges, playhead: spot, spot: spot, min: min, max: max }));
    };
    proto.get = function (element) {
        for (var i = 0, il = this._items.length; i < il; i++) {
            var item = this._items[i];
            if (item.element === element) {
                return item;
            }
        }
        return null;
    };
    proto.update = function (ratio, force) {
        //console.log('**************************ratio:', ratio, '             len:', this._items.length)
        for (var i = 0, il = this._items.length; i < il; i++) {
            var item = this._items[i], ranges = item.ranges;
            if (ratio === item.playhead && !force) {
                    continue;
            }
           // console.log($(item.element).attr('class'), '  index:', i, '   ratio:', ratio, '   item.playhead:', item.playhead, '    item.spot:', item.spot, '   item.min:', item.min, '   item.max:', item.max, item.playhead <= item.min)
            if ((force && ratio <= item.playhead) || ratio < item.playhead) {
                if (item.playhead <= item.min && !force) {
                    continue;
                }
                for (var j = ranges.length - 1; j >= 0; j--) {
                    var range = ranges[j];
                    if (range.start <= item.playhead || range.end <= item.playhead) {
                        //console.log('====================B:', rangeSeekValue((ratio - range.start) / (range.end - range.start)))
                        range.tween.seek(rangeSeekValue((ratio - range.start) / (range.end - range.start)));
                    }
                }
            } else if (ratio > item.playhead) {
                if (item.playhead >= item.max && !force) {
                    continue;
                }
                for (var j = 0, jl = ranges.length; j < jl; j++) {
                    var range = ranges[j];
                    if (range.start >= item.playhead || range.end >= item.playhead) {
                        //console.log('====================A:', rangeSeekValue((ratio - range.start) / (range.end - range.start)))
                        range.tween.seek(rangeSeekValue((ratio - range.start) / (range.end - range.start)));
                    }
                }
            }
            item.playhead = rangeSeekValue(ratio);
        }
    };
    function rangeSeekValue(v) {
        return Math.min(1, Math.max(0, v));
    }
    proto.clean = function () {
        for (var i = this._items.length - 1; i >= 0; i--) {
            var item = this._items[i];
            if (item.useless()) {
                this._items.splice(i, 1);
                item.dispose();
                item = null;
            }
        }
    };
    proto.remove = function (item) {
        var index = this._items.indexOf(item);
        if (index >= 0) {
            this._instances.splice(index, 1);
        }
    };
    return Scheme;
});