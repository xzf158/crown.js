define(['hance', 'jquery', 'crown/utils/Uri', 'greensock/TweenMax'], function (hance, $, Uri) {
    var Scheme = hance.inherit('site.Spinner.Artist', function () { });
    var proto = Scheme.prototype;
    proto.init = function (element, options) {
        this._element = $(element);
        this._valueElement = $('.spinner-value');
        if (this._valueElement.length <= 0) {
            this._valueElement = $('<div class="spinner-value">0%</div>').appendTo(element);
        }
    };
    proto.show = function () {
        this.progress(0);
        this._element.show();
    };
    proto.hide = function () {
        this._element.hide();
    };
    proto.progress = function (value) {
        this._valueElement.html(Math.floor(this._currentWeight / this._totalWeight * 100) + '%');
    };
    return Scheme;
});