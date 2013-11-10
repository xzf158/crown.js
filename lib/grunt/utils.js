var fs = require('fs');
var shell = require('shelljs');
var grunt = require('grunt');
var spawn = require('child_process').spawn;
var version;

module.exports = {
  init: function() {
    // if (!process.env.TRAVIS) {
    //   shell.exec('npm install');
    // }
  },

  getVersion: function(){
    if (version) return version;

    var package = JSON.parse(fs.readFileSync('package.json', 'UTF-8'));
    var match = package.version.match(/^([^\-]*)(?:\-(.+))?$/);
    var semver = match[1].split('.');
    var hash = shell.exec('git rev-parse --short HEAD', {silent: true}).output.replace('\n', '');

    var fullVersion = match[1];

    if (match[2]) {
      fullVersion += '-';
      fullVersion += (match[2] == 'snapshot') ? hash : match[2];
    }

    version = {
      full: fullVersion,
      major: semver[0],
      minor: semver[1],
      dot: semver[2].replace(/rc\d+/, ''),
      codename: package.codename,
      cdn: package.cdnVersion
    };

    return version;
  },


  startKarma: function(config, singleRun, done){
    var browsers = grunt.option('browsers');
    var reporters = grunt.option('reporters');
    var noColor = grunt.option('no-colors');
    var port = grunt.option('port');
    var p = spawn('node', ['node_modules/karma/bin/karma', 'start', config,
      singleRun ? '--single-run=true' : '',
      reporters ? '--reporters=' + reporters : '',
      browsers ? '--browsers=' + browsers : '',
      noColor ? '--no-colors' : '',
      port ? '--port=' + port : ''
    ]);
    p.stdout.pipe(process.stdout);
    p.stderr.pipe(process.stderr);
    p.on('exit', function(code){
      if(code !== 0) grunt.fail.warn("Karma test(s) failed. Exit code: " + code);
      done();
    });
  },

  process: function(src, HN_VERSION, strict){
    var processed = src
      .replace(/"HN_VERSION_FULL"/g, HN_VERSION.full)
      .replace(/"HN_VERSION_MAJOR"/, HN_VERSION.major)
      .replace(/"HN_VERSION_MINOR"/, HN_VERSION.minor)
      .replace(/"HN_VERSION_DOT"/, HN_VERSION.dot)
      .replace(/"HN_VERSION_CDN"/, HN_VERSION.cdn)
      .replace(/"HN_VERSION_CODENAME"/, HN_VERSION.codename);
    if (strict !== false) processed = this.singleStrict(processed, '\n\n', true);
    return processed;
  },

  singleStrict: function(src, insert){
    return src
      .replace(/\s*("|')use strict("|');\s*/g, insert) // remove all file-specific strict mode flags
      .replace(/(\(function\([^)]*\)\s*\{)/, "$1'use strict';"); // add single strict mode flag
  },

  //rewrite connect middleware
  rewrite: function(){
    return function(req, res, next){
      var REWRITE = /\/(guide|api|cookbook|misc|tutorial|error).*$/,
          IGNORED = /(\.(css|js|png|jpg)$|partials\/.*\.html$)/,
          match;

      if (!IGNORED.test(req.url) && (match = req.url.match(REWRITE))) {
        console.log('rewriting', req.url);
        req.url = req.url.replace(match[0], '/index.html');
      }
      next();
    };
  },

  parallelTask: function(args, options) {
    var task = {
      grunt: true,
      args: args,
      stream: options && options.stream
    };

    args.push('--port=' + this.sauceLabsAvailablePorts.pop());

    if (args.indexOf('test:e2e') !== -1 && grunt.option('e2e-browsers')) {
      args.push('--browsers=' + grunt.option('e2e-browsers'));
    } else if (grunt.option('browsers')) {
      args.push('--browsers=' + grunt.option('browsers'));
    }

    if (grunt.option('reporters')) {
      args.push('--reporters=' + grunt.option('reporters'));
    }

    return task;
  },

  // see http://saucelabs.com/docs/connect#localhost
  sauceLabsAvailablePorts: [9000, 9001, 9080, 9090, 9876]
};