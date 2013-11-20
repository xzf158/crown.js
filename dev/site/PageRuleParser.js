define(['hance'], function (hance, $) {
    var Scheme = hance.inherit("crown.site.PageRuleParser", function () { });
    var proto = Scheme.prototype;
    proto.init = function (vars) {
        this._vars = {};
        this.setVars(vars);
    };
    proto.setVars = function (vars) {
        for (var i in vars) {
            this._vars[i] = vars[i];
        }
    };
    proto.setVar = function (name, value) {
        this._vars[name] = value;
    };
    proto.calc = function (expr) {
        var fun = '';
        for (var i in this._vars) {
            if (typeof this._vars[i] === 'string') {
                fun += 'var ' + i + '="' + this._vars[i].replace(/\\/ig, '\\\\') + '";';
            } else {
                fun += 'var ' + i + '=' + this._vars[i] + ';';
            }
        }
        fun += 'return ' + expr + ';';
        /* jshint ignore:start */
        return Function(fun)();
        /* jshint ignore:end */
    };

    return Scheme;
});