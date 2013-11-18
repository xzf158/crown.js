// Console-polyfill. MIT license.
// https://github.com/paulmillr/console-polyfill
// Make it safe to do console.log() always.
(function (con) {
    'use strict';
    var prop, method;
    var empty = {};
    var dummy = function () { };
    var properties = 'memory'.split(',');
    var methods = ('assert,count,debug,dir,dirxml,error,exception,group,' +
       'groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,' +
       'time,timeEnd,trace,warn').split(',');
    while (prop = properties.pop()) con[prop] = con[prop] || empty;
    while (method = methods.pop()) con[method] = con[method] || dummy;
})(window.console = window.console || {});

document.cancelFullScreen = document.webkitCancelFullScreen ||
                    document.mozCancelFullScreen;

require.config({
    baseUrl: typeof configData === 'object' ? configData.baseUrl : './',
    waitSeconds:0,
    paths: {
        "jquery": "vendors/jquery/jquery",
        'domReady': 'vendors/requirejs-domready/domReady',
        'swfobject': 'vendors/swfobject/swfobject-amd',
        'modernizr': 'vendors/modernizr/modernizr',
        'jquery.easing': 'vendors/jquery/jquery.easing',
        'hammer': 'vendors/hammerjs/dist/jquery.hammer',
        'history': 'vendors/history.js/scripts/bundled-uncompressed/html5/native.history'
    },
    shim: {
    }, packages: [
        { name: 'greensock', main: '', location: 'vendors/greensock' },
        { name: 'crown', main: 'core', location: 'vendors/crown' },
        { name: 'crown.utils', main: '', location: 'vendors/crown.utils' },
        { name: 'crown.vminpoly', main: 'vminpoly', location: 'vendors/crown.vminpoly' },
        { name: 'crown.browser', main: 'browser', location: 'vendors/crown.browser' },
        { name: 'crown.ui', main: '', location: 'vendors/crown.ui' },
        { name: 'crown.site', main: 'Stage', location: 'vendors/crown.site' },
        { name: 'crown.shim', main: '', location: 'vendors/crown.shim' },
        { name: 'prettify', main: 'prettify', location: 'vendors/prettify/src' },
        { name: 'crown.player', main: 'MediaPlayer', location: 'vendors/crown.player' }]
});

require(['scripts/Main', 'crown.browser', 'crown.vminpoly', 'domReady!'], function (Main, browser) {
    if (browser.msie && browser.version < 9) {
        require(['crown.shim/cssfx'], function(){
            new Main();
        });
    } else {
        new Main();
    }
});


