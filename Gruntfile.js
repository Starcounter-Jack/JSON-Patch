module.exports = function(grunt) {
    var browsers = [
        {
            browserName: 'internet explorer',
            platform: 'Windows 10',
            version: '11.285'
        }
    ];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            server: {
                options: {
                    base: '',
                    port: 9999
                }
            }
        },

        'saucelabs-jasmine': {
            all: {
                options: {
                    urls: ['http://127.0.0.1:9999/test'],
                    browsers: browsers,
                    build: process.env.TRAVIS_JOB_ID,
                    testname: 'JSON-Patch test',
                    throttled: 3,
                    sauceConfig: {
                        'video-upload-on-pass': false
                    }
                }
            }
        },
        watch: {}
    });

    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-saucelabs');

    grunt.registerTask('default', ['connect', 'saucelabs-jasmine']);
};
