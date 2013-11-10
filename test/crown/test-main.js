var allTestFiles = [];
var TEST_REGEXP = /spec\.js$/;

Object.keys(window.__karma__.files).forEach(function(file) {
    if (TEST_REGEXP.test(file)) {
        allTestFiles.push(file);
    }
});

require.config({
    baseUrl: '/base/dev',
    paths: {
        'jquery': 'vendors/jquery/jquery',
        'domReady': 'vendors/requirejs-domready/domReady',
        'swfobject': 'vendors/swfobject/swfobject-amd',
        'modernizr': 'vendors/modernizr/modernizr',
        'jquery.easing': 'vendors/jquery/jquery.easing',
        'hammer': 'vendors/hammerjs/dist/jquery.hammer',
        'history': 'vendors/history.js/scripts/bundled-uncompressed/html5/native.history'
    },
    shim: {}, 
    packages: [
        { name: 'greensock', main: '', location: 'vendors/greensock' },
        { name: 'crown', main: 'core', location: 'vendors/crown' },
        { name: 'crown.utils', main: '', location: 'vendors/crown.utils' },
        { name: 'crown.vminpoly', main: 'vminpoly', location: 'vendors/crown.vminpoly' },
        { name: 'crown.browser', main: 'browser', location: 'vendors/crown.browser' },
        { name: 'crown.ui', main: '', location: 'vendors/crown.ui' },
        { name: 'crown.site', main: 'Stage', location: 'vendors/crown.site' },
        { name: 'crown.shim', main: '', location: 'vendors/crown.shim' },
        { name: 'crown.player', main: 'MediaPlayer', location: 'vendors/crown.player' }],
    deps: allTestFiles,
    callback: window.__karma__.start
});
