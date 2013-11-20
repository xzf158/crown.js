define(['hance', 'crown/utils/Uri', 'jquery'], function (hance, Uri, $) {
    var Scheme = hance.inherit("horn.utils.UriComparer", function () { });
    Scheme.options = { ingnoreProtocol: true,
        ingnoreAccount: true,
        ingnorePort: true,
        ingnoreAnchor: true,
        ingnoreSearch: false};
    var proto = Scheme.prototype;
    proto.init = function () {
    };
    proto.isUrlEqual = function (url0, url1) {
        return this.compareUrl(url0, url1) === 0;// Uri.absolute(url0).replace(/\/?#.*/g, '') == Uri.absolute(url1).replace(/\/?#.*/g, '');
    };
    proto.isUrlHigher = function (higherUrl, lowerUrl, options) {
        return this.compareUrl(higherUrl, lowerUrl, options) === -1;
    };
    proto.isUrlLower = function (lowerUrl, higherUrl, options) {
        return this.compareUrl(higherUrl, lowerUrl, options) === -1;
    };
    //0 equal
    //1 higherUrl: /a/b lowerUrl: /a/
    //-1 higherUrl: /a/ lowerUrl: /a/b
    //-2 higherUrl: /an/ lowerUrl: /a/b
    proto.compareUrl = function (higherUrl, lowerUrl, options) {//url in site map, root is highest url.
        var higherUri = new Uri(higherUrl),
            lowerUri = new Uri(lowerUrl),
            options = $.extend({}, Scheme.options, options);
        if (!options.ingnoreProtocol && higherUri.getProtocol() !== lowerUri.getProtocol()) {
            return -2;
        }
        if (!options.ingnoreAccount && higherUri.getAccount() !== lowerUri.getAccount()) {
            return -2;
        }
        if (higherUri.getFile() !== lowerUri.getFile()) {
            return -2;
        }
        var higherPathParts = higherUri.getPath().split('/'),
            lowerPathParts = lowerUri.getPath().split('/'),
            maxLength = Math.max(higherPathParts.length, lowerPathParts.length);
        for (var i = 0; i < maxLength; i++) {
            var higherPart = higherPathParts[i], lowerPart = lowerPathParts[i];
            if (higherPart !== lowerPart) {
                if (!higherPart && lowerPart) {
                    return -1;
                } else if (higherPart && !lowerPart) {
                    return 1;
                }
                return -2;
            }
        }
        if (!options.ingnoreSearch){
            var s0 = higherUri.getSearch(), s1 = lowerUri.getSearch();
            if (s0 === s1) {
                if (options.ingnoreAnchor) {
                    return 0;
                }
            } else if(s0 === '' && s1 !== '' ){
                return -1;
            }else if (s0 !== '' && s1 === ''){
                return 1;
            }else{
                return -2;
            }
        }
        if (!options.ingnoreAnchor){
            var a0 = higherUri.getAnchor(), a1 = lowerUri.getAnchor();
            //console.log('a0: ', a0, '  a1:', a1)
            if (a0 === a1){
                return 0;
            } else if(a0 === '' && a1 !== '' ){
                return -1;
            }else if (a0 !== '' && a1 === ''){
                return 1;
            }else{
                return -2;
            }
        }
        return 0;
    };
    return Scheme;
});