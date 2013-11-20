//http://objectmix.com/javascript/352627-relative-url-absolute-url.html
//http://blog.stevenlevithan.com/archives/parseuri
define(['jquery', 'hance'], function ($, hance) {
    var Scheme = hance.inherit('crown.utils.Uri', function () { });
    Scheme.combine = function () {
        var path = '';
        for (var i in arguments) {
            var arg = arguments[i];
            if (path[path.length - 1] === '/' && arg[0] === '/') {
                path += arg.substring(1);
            } else {
                path += arg;
            }
        }
        return path;
    };
    var divElement = document.createElement('div'),
        baseUrl = window.location.href, cachedAbsUrls = {};
    Scheme.absolute = function (path) {
        //var node = $('<a>', { href: path }).appendTo(document.body);
        //var path = node[0].href;
        //node.remove();
        if (window.location.href === baseUrl && cachedAbsUrls[path]) {
            return cachedAbsUrls[path];
        }
        divElement.innerHTML = '<a href="' + path + '">x</a>';
        var absPath = divElement.firstChild.href;
        cachedAbsUrls[path] = absPath;
        return absPath;
    };
    Scheme.relative = function (url, root) {
        url = Scheme.absolute(url);
        root = Scheme.absolute(root);
        if (url.indexOf(root) === 0) {
            url = url.substring(root.length);
        }
        return url;
    };
    Scheme.setParams = function (url, params, removeOthers) {
        return ((new crown.Uri(url)).setParams(params, removeOthers)).url;
    };
    Scheme.appendSearch = function (url, search, replace) {
        return ((new crown.Uri(url)).appendSearch(search, replace)).url;
    };
    Scheme.compare = function () {
        var path0 = Scheme.absolute(arguments[0]);
        if (path0[path0.length - 1] !== '/'){
            path0 += '/';
        }
        for (var i = 1, il = arguments.length; i < il; i++) {
            var path1 = Scheme.absolute(arguments[i]);
            if (path1[path1.length - 1] !== '/') {
                path1 += '/';
            }
            if (path0 !== path1) {
                //console.log("p0:", path0, "  p1:", path1);
                return false;
            }
        }
        return true;
    };
    Scheme.contains = function () {
        var path = Scheme.absolute(arguments[0]);
        for (var i = 1, il = arguments.length; i < il; i++) {
            var arg = arguments[i];
            if (arg instanceof Array) {
                for (var j = 0, jl = arg.length; j < jl; j++) {
                    if (path.indexOf(Scheme.absolute(arg[j])) !== 0) {
                        return false;
                    }
                }
            }else if (path.indexOf(Scheme.absolute(arguments[i])) !== 0) {
                return false;
            }
        }
        return true;
    };
    Scheme.options = {
        strictMode: false,
        keys: ["url", "protocol", "authority", "account", "user", "password", "host", "port", "relative", "path", "directory", "file", "search", "anchor"],
        query: {
            parser: /(?:^|&)([^&=]*)=?([^&]*)/g
        },
        parser: {
            strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
        }
    };
    var proto = Scheme.prototype;
    hance.properties(proto, [{ name: 'url', getter: true, setter: true },
    { name: 'protocol', getter: true, setter: true }, 
    { name: 'authority', getter: true, setter: true }, 
    { name: 'account', getter: true, setter: true }, 
    { name: 'user', getter: true, setter: true },
    { name: 'password', getter: true, setter: true },
    { name: 'host', getter: true, setter: true },
    { name: 'port', getter: true, setter: true },
    { name: 'relative', getter: true, setter: true },
    { name: 'path', getter: true, setter: true },
    { name: 'directory', getter: true, setter: true },
    { name: 'file', getter: true, setter: true },
    { name: 'search', getter: true, setter: true },
    { name: 'anchor', getter: true, setter: true }]);

    proto.init = function (url, relative) {
        this._url = url;
        this._protocol = '';
        this._account = '';
        this._user = '';
        this._password = '';
        this._host = '';
        this._port = '';
        this._relative = '';
        this._path = '';
        this._directory = '';
        this._file = '';
        this._search = '';
        this._anchor = '';

        this.parse(relative);
    };
    proto.combine = function () {
        var path = '';
        for (var i in arguments) {
            var arg = arguments[i];
            if (path[path.length - 1] === '/' && arg[0] === '/') {
                path += arg.substring(1);
            } else {
                path += arg;
            }
        }
        this.setPath(path);
    };
    proto.setUrl = function (val) {
        if (this._url !== val) {
            this._url = val;
        }
    };
    proto.setProtocol = function (val) {
        if (this._protocol !== val) {
            var url = val + '://' + this._autority + this._relative;
            this.copyFrom(new Scheme(url));
        }
    };
    proto.setAuthority = function (val) {
        if (this._authority !== val) {
            var url = this._protocol + '://' + val + this._relative;
            this.copyFrom(new Scheme(url));
        }
    };
    proto.setAccount = function (val) {
        if (this._account !== val) {
            var url = '';
            if (val) {
                url = this._protocol + '://' + val + '@' + this._host + this._relative;
            }
            else {
                url = this._protocol + '://' + this._host + this._relative;
            }
            this.copyFrom(new Scheme(url));
        }
    };
    proto.setUser = function (val) {
        if (this._user !== val) {
            var url = '';
            var account = val + ':' + this._password;
            if (account > 1) {
                url = this._protocol + '://' + account + '@' + this._host + this._relative;
            }
            else {
                url = this._protocol + '://' + this._host + this._relative;
            }
            this.copyFrom(new Scheme(url));
        }
    };
    proto.setPassword = function (val) {
        if (this._password !== val) {
            var url = '';
            var account = this._user + ':' + val;
            if (account > 1) {
                url = this._protocol + '://' + account + '@' + this._host + this._relative;
            }
            else {
                url = this._protocol + '://' + this._host + this._relative;
            }
            this.copyFrom(new Scheme(url));
        }
    };
    proto.setHost = function (val) {
        if (this._host !== val) {
            var url = '';
            if (this._account) {
                url = this._protocol + '://' + this._account + '@' + this._host + this._relative;
            }
            else {
                url = this._protocol + '://' + this._host + this._relative;
            }
            this.copyFrom(new Scheme(url));
        }
    };
    proto.setPort = function (val) {
        if (this.port !== val) {
            var url = '';
            if (val) {
                if (this._account) {
                    url = this._protocol + '://' + this._account + '@' + this._host + ':' + val + this._relative;
                }
                else {
                    url = this._protocol + '://' + this._host + ':' + val + this._relative;
                }
            }
            else {
                if (this._account) {
                    url = this._protocol + '://' + this._account + '@' + val + this._relative;
                }
                else {
                    url = this._protocol + '://' + this._host + this._relative;
                }
            }
            this.copyFrom(new Scheme(url));
        }
    };
    proto.setRelative = function (val) {
        if (this._relative !== val) {
            var url = this._protocol + '://' + this._authority + val;
            this.copyFrom(new Scheme(url));
        }
    };
    proto.setPath = function (val) {
        if (this._path !== val) {
            var url = this._protocol + '://' + this._authority + val + this._file;
            this.copyFrom(new Scheme(url));
        }
    };
    proto.setDirectory = function (val) {
        if (this._directory !== val) {
            var url = this._protocol + '://' + this._authority + val + this._file;
            if (this._search) {
                url += '?' + this._search;
            }
            if (this._anchor) {
                url += '#' + this._anchor;
            }
            this.copyFrom(new Scheme(url));
        }
    };
    proto.setFile = function (val) {
        if (this._file !== val) {
            var url = this._protocol + '://' + this._authority + this._directory + val;
            if (this._search) {
                url += '?' + this._search;
            }
            if (this._anchor) {
                url += '#' + this._anchor;
            }
            this.copyFrom(new Scheme(url));
        }
        return this;
    };
    proto.setSearch = function (val) {
            var url = this._protocol + '://' + this._authority + this._path;
            if (val) {
                url += '?' + val;
            }
            if (this._anchor) {
                url += '#' + this._anchor;
            }
            this._url = url;
            this.parse();
        return this;
    };
    proto.setParams = function (params, removeOthers) {
        var url = this._protocol + '://' + this._authority + this._path;
        var query = '';
        if (removeOthers !== false) {
            params = $.extend({}, this.params, params);
        }
        for (var qn in params) {
            if (params[qn] !== undefined && params[qn] !== '') {
                query += qn + '=' + params[qn];
            }
        }
        if (query !== '') {
            url += '?' + query;
        }
        if (this._anchor) {
            url += '#' + this._anchor;
        }
        this._url = url;
        this.parse();
        return this;
    };
    proto.appendSearch = function (val, replace) {
        var url = this._protocol + '://' + this._authority + this._path;
        var search = this._search + '&' + val;
        var kvps = search.split('&');
        var params = {};
        for (var i = 0, il = kvps.length; i < il; i++) {
            var kvp = kvps[i].split('=');
            if (kvp.length === 2) {
                if (params.hasOwnProperty(kvp[0]) && (replace === undefined || replace === false)) {
                    continue;
                }
                params[kvp[0]] = kvp[1];
            }
        }

        var queries = [];
        for (var k in params) {
            queries.push(k + '=' + params[k]);
        }
        //console.log(params);
        search = queries.join('&');
        if (search !== "") {
            url += '?' + search;
        }

        //console.log("------------url:", url, "   search:", this.search);
        this._url = url;
        this.parse();
        return this;
    };
    proto.setAnchor = function (val) {
        if (this._anchor !== val) {
            var url = this._protocol + '://' + this._authority + this._path;
            if (this._search) {
                url += '?' + this._search;
            }
            if (val) {
                url += '#' + val;
            }
            this.copyFrom(new Scheme(url));
        }
        return this;
    };
    proto.copyFrom = function (nu) {
        for (var p in this.params) {
            this.params[p] = undefined;
        }
        this._search = {};
        for (var f in nu._search) {
            this._search[f] = nu._search[f];
        }
        for (var m in nu.params) {
             this.params[m] = nu.params[m];
        }
        return this;
    };
    proto.parse = function (relative, currentUrl) {
        if (currentUrl === undefined) {
            currentUrl = location.href;
        }
        if (relative === undefined) {
            this._url = Scheme.absolute(this._url);
        } else if (relative && this._url && !/^\w+:/.test(this._url)) {
            var uri = new Scheme(currentUrl);
            if (this._url.indexOf('/') === 0) {
                this._url = uri.protocol + '://' + uri.authority + this._url;
            }
            else {
                this._url = uri.protocol + '://' + uri.authority + uri.directory + this._url;
            }
        }
        var o = Scheme.options,
        m = o.parser[o.strictMode ? "strict" : "loose"].exec(this._url),
        i = 14;
        while (i--) {
            this['_' + [o.keys[i]]] = m[i] || "";
        }

        var self = this;
        this.params = {};
        this['_' + o.keys[12]].replace(o.query.parser, function ($0, $1, $2) {
            if ($1) {
                self.params[$1] = $2;
            }
        });
    };
    return Scheme;
});