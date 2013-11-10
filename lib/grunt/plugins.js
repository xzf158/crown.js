var bower = require('bower');
var util = require('./utils.js');
var spawn = require('child_process').spawn;

module.exports = function(grunt) {
    grunt.registerMultiTask('test', '**Use `grunt test` instead**', function() {
        util.startKarma.call(util, this.data, true, this.async());
    });

    grunt.registerMultiTask('autotest', 'Run and watch the unit tests with Karma', function() {
        util.startKarma.call(util, this.data, false, this.async());
    });

    grunt.registerTask('collect-errors', 'Combine stripped error files', function() {
        util.collectErrors();
    });

    grunt.registerTask('bower', 'Install Bower packages.', function() {
        var done = this.async();

        bower.commands.install()
            .on('log', function(result) {
                grunt.log.ok('bower: ' + result.id + ' ' + result.data.endpoint.name);
            })
            .on('error', grunt.fail.warn.bind(grunt.fail))
            .on('end', done);
    });
};
