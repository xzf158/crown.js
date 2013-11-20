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
        'hance': 'vendors/hance.js/dev/hance',
        'hammer': 'vendors/hammerjs/dist/jquery.hammer',
        'history': 'vendors/history.js/scripts/bundled-uncompressed/html5/native.history'
    },
    shim: {}, 
    packages: [
        { name: 'greensock', main: '', location: 'vendors/greensock' },
        { name: 'crown', main: '', location: '../../../dev' }],
    deps: allTestFiles,
    callback: window.__karma__.start
});
