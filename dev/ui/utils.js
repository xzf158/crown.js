define(['hance'], function (hance) {
    var Scheme = hance.inherit("crown.ui.utils", {});
    //Scheme.disposeControl = function (control, name) {
    //    if (window.outlets !== undefined && window.outlets[control.outlet] == control) {
    //        window.outlets[control.outlet] = null;
    //    }
    //    if (control.element && control.element._instances !== undefined && control.element._instances[name] == control) {
    //        control.element._instances[name] = null;
    //    }
    //    control.element = null;
    //};
    //Scheme.findInstance = function (element, sign) {
    //};

    var lastGenerateId = 1;
    Scheme.generateId = function () {
        return lastGenerateId++;
    };
    Scheme.isInDocument = function (el) {
        var html = document.body.parentNode;
        while (el) {
            if (el === html) {
                return true;
            }
            el = el.parentNode;
        }
        return false;
    };
    return Scheme;
});