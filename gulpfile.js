var gulp = require("gulp");
var gulpBabel = require("gulp-babel");
var gulpConcat = require("gulp-concat");

var paths = {
  srcComponentsJsx: "src/Components/*.jsx",
  srcJs: "src/*.js",
  srcHtml: "src/*.{html,css,png,json}",
  dist: "dist/"
};

gulp.task("default", function () {
  gulp
    .src(paths.srcComponentsJsx)
	  .pipe(gulpBabel({ presets: ["es2015", "react"] }))
    .pipe(gulpConcat("/components.js"))
	  .pipe(gulp.dest(paths.dist));
    
  gulp
    .src(paths.srcJs)
	  .pipe(gulpBabel({ presets: ["es2015"] }))
    .pipe(gulp.dest(paths.dist));
    
  gulp
    .src(paths.srcHtml)
    .pipe(gulp.dest(paths.dist));
});
