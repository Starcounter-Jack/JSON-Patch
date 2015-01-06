module.exports = function(grunt) {

  grunt.initConfig({
    uglify: {
      options: {
        beautify: {
          ascii_only: true
        },
        preserveComments: "some"
      },
      default: {
        files: [
          {
            expand: true,     // Enable dynamic expansion.
            cwd: 'src/',      // Src matches are relative to this path.
            src: ['json-*.js'], // Actual pattern(s) to match.
            dest: 'dist/',   // Destination path prefix.
            ext: '.min.js',   // Dest filepaths will have this extension.
            extDot: 'first'   // Extensions in filenames begin after the first dot
          },
        ]
      }
    }
  });    
grunt.loadNpmTasks('grunt-contrib-uglify');
};
