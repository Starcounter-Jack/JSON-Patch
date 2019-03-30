const request = require('request');

module.exports = function(grunt) {
    var browsers = [
        {
            browserName: 'internet explorer',
            platform: 'Windows 10',
            version: '11.285'
        },
        {
            browserName: 'chrome',
            platform: 'Windows 10'
        },
        {
            browserName: 'firefox',
            platform: 'Windows 10'
        },
        {
            browserName: 'safari',
            platform: 'macOS 10.13'
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
                    browsers,
                    public: 'public',
                    onTestComplete: function(result, callback) {
                        // Called after a unit test is done, per page, per browser
                        // 'result' param is the object returned by the test framework's reporter
                        // 'callback' is a Node.js style callback function. You must invoke it after you
                        // finish your work.
                        // Pass a non-null value as the callback's first parameter if you want to throw an
                        // exception. If your function is synchronous you can also throw exceptions
                        // directly.
                        // Passing true or false as the callback's second parameter passes or fails the
                        // test. Passing undefined does not alter the test result. Please note that this
                        // only affects the grunt task's result. You have to explicitly update the Sauce
                        // Labs job's status via its REST API, if you want so.

                        // The example below negates the result, and also updates the Sauce Labs job's status
                        var user = process.env.SAUCE_USERNAME;
                        var pass = process.env.SAUCE_ACCESS_KEY;
                        request.put(
                            {
                                url: [
                                    'https://saucelabs.com/rest/v1',
                                    user,
                                    'jobs',
                                    result.job_id
                                ].join('/'),
                                auth: { user: user, pass: pass },
                                json: { passed: !result.passed }
                            },
                            function(error, response, body) {
                                if (error) {
                                    callback(error);
                                } else if (response.statusCode !== 200) {
                                    callback(
                                        new Error('Unexpected response status')
                                    );
                                } else {
                                    callback(null, !result.passed);
                                }
                            }
                        );
                    },
                    build: process.env.TRAVIS_JOB_ID,
                    testname: 'JSON-Patch tests',
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
