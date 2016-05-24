//
// Runs browserify + transforms on a JS asset package.
//

var browserify = require('browserify');
var gzipAsWell = require('./gzip-aswell');
var UglifyJS = require("uglify-js");

module.exports = function(file, options, callback) {
  var start = new Date().getTime();
  console.log('Bundling ' + file + '...');
  var b = browserify().add(options.assetsDir + file);
  options.transforms.forEach(function(t) {
    try { b.transform(require(t)) } catch (e) {};
  });
  options.globalTransforms.forEach(function(t) {
    try { b.transform({ global: true }, require(t)) } catch (e) {};
  });
  b.bundle(function(err, buf) {
    if (err) return callback(err);
    var fname = options.publicDir + file.split('.')[0] + '.js';
    var minified = UglifyJS.minify(buf.toString(), { fromString: true }).code;
    gzipAsWell(minified, fname, '.jgz', options.publicDir, function() {
      var diff = new Date().getTime() - start;
      console.log('Finished bundling ' + file + ' in ' + diff + 'ms');
      callback.apply(this, arguments);
    });
  });
}
