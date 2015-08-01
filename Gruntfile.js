"use strict";

module.exports = function(grunt)
{
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    jshint: {
      options: {
        jshintrc: ".jshintrc"
      },
      gruntfile: {
        src: "Gruntfile.js"
      },
      lib: {
        src: ["src/**/*.js"]
      },
      test: {
        src: ["test/**/*.js"]
      }
    },

    jasmine: {
     src: [],
     options: {
      outfile: "test/_specrunner.html",
      specs: "<%= browserify.test.dest %>"
     }
    },

    browserify: {
      test: {
        src: ["<%= jshint.test.src %>"],
        dest: "test/specs.js",
        options: {
          browserifyOptions: {
            debug: true,
            paths: ["./node_modules", "./src"]
          }
        }
      },
      build: {
        src: ["src/<%= pkg.name %>.js"],
        dest: "build/<%= pkg.name %>.js",
        options: {
          banner: "/**\n * <%= pkg.name %> v<%= pkg.version %> build <%= grunt.template.today(\"dd.mm.yyyy\") %>\n" +
            " * <%= pkg.homepage %>\n" +
            " * Copyright <%= grunt.template.today(\"yyyy\") %> <%= pkg.author.name %>, <%= pkg.license %>\n */\n"
        }
      }
    },

    uglify: {
      build: {
        options: {
          banner: "<%= browserify.build.options.banner %>"
        },
        files: {
          "build/<%= pkg.name %>.min.js": ["<%= browserify.build.dest %>"]
        }
      }
    },

    clean: {
      test: ["<%= browserify.test.dest %>"]
    },

    yuidoc: {
      compile: {
        name: "<%= pkg.name %>",
        description: "<%= pkg.description %>",
        version: "<%= pkg.version %>",
        url: "<%= pkg.homepage %>",
        options: {
          paths: ["./src/"],
          outdir: "docs"
        }
      }
    },

    watch: {
      gruntfile: {
        files: "<%= jshint.gruntfile.src %>",
        tasks: ["jshint:gruntfile"]
      },
      lib: {
        files: "<%= jshint.lib.src %>",
        tasks: ["jshint:lib", "browserify:test", "jasmine"]
      },
      test: {
        files: "<%= jshint.test.src %>",
        tasks: ["jshint:test", "browserify:test", "jasmine"]
      }
    }
  });

  // Plugins.
  grunt.loadNpmTasks("grunt-browserify");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-jasmine");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-yuidoc");

  // Task definitions.
  grunt.registerTask("default", ["clean:test", "jshint", "browserify:test", "jasmine", "browserify:build", "uglify", "clean:test"]);
  grunt.registerTask("test", ["clean:test", "jshint", "browserify:test", "jasmine", "clean:test"]);
  grunt.registerTask("build", ["browserify:build", "uglify"]);
};
