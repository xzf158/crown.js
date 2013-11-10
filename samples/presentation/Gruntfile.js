"use strict";
var util = require('./lib/grunt/utils.js');

module.exports = function (grunt) {
    //var HN_VERSION = util.getVersion();
    //var dist = 'dist-' + HN_VERSION.full;

    util.init();
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: '',
        parallel: {
            travis: {
                tasks: [
                    util.parallelTask(['test:unit', 'test:docgen', 'tests:docs'], {
                        stream: true
                    }),
                    util.parallelTask(['test:e2e'])
                ]
            }
        },
        clean: {
            dist: {
                src: ['dist/**']
            }
        },
        'regex-replace': {
            dist: {
                src: ['dist/*.html'],
                actions: [{
                    name: 'requirejs',
                    search: 'data-main=.*vendors/requirejs/require.js',
                    replace: 'src="scripts/require.min.js',
                    flags: 'ig'
                }]
            }
        },

        connect: {
            devserver: {
                options: {
                    port: 8000,
                    hostname: '0.0.0.0',
                    base: './dev',
                    keepalive: true,
                    middleware: function (connect, options) {
                        return [
                            connect.favicon('images/favicon.ico'),
                            connect.static(options.base),
                            connect.directory(options.base)
                        ];
                    }
                }
            },
            testserver: {
                options: {
                    // We use end2end task (which does not start the webserver)
                    // and start the webserver as a separate process (in travis_build.sh)
                    // to avoid https://github.com/joyent/libuv/issues/826
                    port: 8000,
                    hostname: '0.0.0.0',
                    base: './dev',
                    middleware: function (connect, options) {
                        return [
                            function (req, resp, next) {
                                // cache get requests to speed up tests on travis
                                if (req.method === 'GET') {
                                    resp.setHeader('Cache-control', 'public, max-age=3600');
                                }

                                next();
                            },
                            connect.favicon('images/favicon.ico'),
                            connect.static(options.base)
                        ];
                    }
                }
            }
        },
        test: {
            crown: 'karma-crown.conf.js'
        },
        autotest: {
            crown: 'karma-crown.conf.js'
        },
        concat: {
            options: {
                banner: '<%= banner %>',
                stripBanners: true
            },
            dist: {
                src: ['dev/vendors/requirejs/require.js', '<%= concat.dist.dest %>'],
                dest: 'dist/scripts/require.js'
            }
        },
        uglify: {
            options: {
                banner: '',
                sourceMap: 'dist/scripts/require-map.js',
                sourceMapRoot: './',
                sourceMappingURL: 'require-map.js',
                sourceMapPrefix: 'dist/scripts/'
            },
            dist: {
                src: '<%= concat.dist.dest %>',
                dest: 'dist/scripts/require.min.js'
            }
        },
        jshint: {
            gruntfile: {
                options: {
                    jshintrc: '.jshintrc'
                },
                src: 'Gruntfile.js'
            },
            devScript: {
                options: {
                    jshintrc: 'dev/scripts/.jshintrc'
                },
                src: ['dev/scripts/**/*.js']
            },
            devHorn: {
                options: {
                    jshintrc: 'dev/vendors/.jshintrc'
                },
                src: ['dev/vendors/crown*/**/*.js']
            }//,
            // test: {
            //     options: {
            //         jshintrc: 'test/.jshintrc'
            //     },
            //     src: ['test/**/*.js']
            // }
        },
        less: {
            compile: {
                options: {
                    paths: ['dev/styles/'],
                    compress: true
                },
                files: [{
                    expand: true,
                    cwd: 'dev/styles',
                    src: ['**/*.less'],
                    dest: 'dev/styles',
                    ext: '.css'
                }]
            }
        },
        watch: {
            script: {
                files: ['dev/scripts/**/*.js'],
                tasks: ['jshint:dev']
            },
            compass: {
                files: ['dev/styles/**/*.less'],
                tasks: ['less']
            },
            // test: {
            //   files: 'test/**/*.js',
            //   tasks: ['jshint:test', 'qunit']
            // }
        },
        requirejs: {
            compile: {
                options: {
                    baseUrl: 'dev/',
                    name: 'scripts/config',
                    mainConfigFile: 'dev/scripts/config.js',
                    out: '<%= concat.dist.dest %>',
                    optimize: 'none'
                }
            }
        },
        imagemin: { // Task
            dist: { // Target
                options: { // Target options
                    optimizationLevel: 3
                },
                files: [{
                    expand: true,
                    cwd: 'dev/',
                    src: ['**/*.png', '**/*.jpg'],
                    dest: 'dist/'
                }]
            }
        },
        htmlmin: {
            dist: {
                options: {
                    /*removeCommentsFromCDATA: true,
          // https://github.com/yeoman/grunt-usemin/issues/44
          //collapseWhitespace: true,
          collapseBooleanAttributes: true,
          removeAttributeQuotes: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeOptionalTags: true*/
                },
                files: [{
                    expand: true,
                    cwd: 'dev',
                    src: ['**/*.html', '!**/vendors/**/*.html'],
                    dest: 'dist/'
                }]
            }
        },
        copy: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'dev/',
                    src: ['**', '!**/images/*.*', '!**/*.html', '!**/*.less', '!scripts/**/*.js', 'scripts/**/*.min.js'],
                    dest: 'dist/'
                }]
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    //grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-jasmine-node');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-regex-replace');
    grunt.loadTasks('lib/grunt');

    grunt.registerTask('default', ['jshint', 'less']);
    grunt.registerTask('webserver', ['connect:devserver']);
    grunt.registerTask('build', ['less', 'clean:dist', 'copy:dist', 'requirejs', 'concat', 'uglify', 'imagemin:dist', 'htmlmin:dist', 'regex-replace:dist']);
};
