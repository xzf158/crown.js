var sharedConfig = require('./karma-shared.conf');

module.exports = function(config) {
    sharedConfig(config, {
        testName: 'App: crown',
        logFile: 'karma-crown.log'
    });

    config.set({
        files: [
            //'dev/vendors/crown/**/*.js',
            //'test/crown/**/*.js'
            {pattern: 'dev/vendors/crown/**/*.js', included: false},
            {pattern: 'test/crown/**/*.spec.js', included: false},
            'test/crown/test-main.js'
        ],

        htmlReporter: {
            outputFile: 'test_out/crown.xml',
            suite: 'crown'
        }
    });
};
