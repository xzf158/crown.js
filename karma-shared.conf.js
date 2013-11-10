module.exports = function(config, specificOptions) {
  config.set({
    frameworks: ['jasmine', 'requirejs'],
    autoWatch: true,
    logLevel: config.LOG_INFO,//config.LOG_DEBUG,//
    logColors: true,
    browsers: ['PhantomJS'],//'PhantomJS', 'Chrome', 'IE', 
    browserDisconnectTimeout: 5000,

    plugins: [
      'karma-jasmine',
      'karma-requirejs',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-ie-launcher',
      'karma-safari-launcher',
      'karma-phantomjs-launcher',
      'karma-sauce-launcher'
    ],

    sauceLabs: {
      username: 'yxchjsh',
      accessKey: '8c38b5d7-95cb-4afd-9c18-2f5e8ed04522',
      startConnect: true,
      testName: 'my unit tests'
    },

    // For more browsers on Sauce Labs see:
    // https://saucelabs.com/docs/platforms/webdriver
    customLaunchers: {
      'SL_Chrome': {
        base: 'SauceLabs',
        browserName: 'chrome'
      },
      'SL_Firefox': {
        base: 'SauceLabs',
        browserName: 'firefox'
      },
      'SL_Safari': {
        base: 'SauceLabs',
        browserName: 'safari',
        platform: 'Mac 10.8',
        version: '6'
      },
      'SL_IE_8': {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 7',
        version: '8'
      },
      'SL_IE_9': {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 2008',
        version: '9'
      },
      'SL_IE_10': {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 2012',
        version: '10'
      }
    }
  });


  if (process.env.TRAVIS) {
    // TODO(vojta): remove once SauceLabs supports websockets.
    // This speeds up the capturing a bit, as browsers don't even try to use websocket.
    config.transports = ['xhr-polling'];

    // Debug logging into a file, that we print out at the end of the build.
    config.loggers.push({
      type: 'file',
      filename: process.env.LOGS_DIR + '/' + (specificOptions.logFile || 'karma.log'),
      level: config.LOG_DEBUG
    });
  }
};