module.exports = function(grunt) {

    grunt.initConfig({
        'connect': {
            demo: {
                options: {
                    open: true,
                    keepalive: true
                }
            }
        },
        watch: {
            all: {
                options: {
                    livereload: true
                },
                files: [
                    '*.html',
                    'examples/**/*.html',
                    'tests/*.js'
                ],
                // tasks: ['jshint'],
            },
        },
        bump: {
          options: {
            files: ['juicy-jsoneditor.html', 'package.json'],
            commit: true,
            commitMessage: '%VERSION%',
            commitFiles: ['juicy-jsoneditor.html', 'package.json'],
            createTag: true,
            tagName: '%VERSION%',
            tagMessage: 'Version %VERSION%',
            push: false,
            // pushTo: 'origin',
            globalReplace: false,
            prereleaseName: false,
            regExp: false
          }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-bump');

    grunt.registerTask('server', ['connect']);
    grunt.registerTask('default', ['watch']);

};
