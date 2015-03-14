var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    gzip = require('zlib').gzip;
try { var browserify = require('browserify'); } catch (e) {};
try { var stylus = require('stylus'); } catch (e) {};

module.exports = function(options, callback) {
  var assetsDir = options.assetsDir, publicDir = options.publicDir;

  // Find the source files
  fs.readdir(assetsDir, function(err, files) {
    if (err) return callback(err);
    async.map(files, function(file, cb) {

      // Browserify + Transforms
      if (browserify && path.extname(file) == '.js'
        || path.extname(file) == '.coffee') {
        var start = new Date().getTime();
        console.log('Bundling ' + file + '...');
        var b = browserify({
          insertGlobals: true,
          noParse: ['jquery'].map(function(lib) {
            return require.resolve(lib);
          })
        }).add(assetsDir + file);
        options.transforms.forEach(function(transform) {
          try { b.transform(require(transform)) } catch (e) {};
        });
        b.bundle(function(err, buf) {
          if (err) return cb(err);
          var fname = publicDir + file.split('.')[0] + '.js';
          gzipAsWell(buf, fname, '.jgz', publicDir, function() {
            var diff = new Date().getTime() - start;
            console.log('Finished bundling ' + file + ' in ' + diff + 'ms');
            cb.apply(this, arguments);
          });
        });

      // Stylus + Sqwish
      } else if (stylus && path.extname(file) == '.styl') {
        var start = new Date().getTime();
        console.log('Processing ' + file + '...');
        stylus.render(fs.readFileSync(assetsDir + file).toString(), {
          filename: assetsDir + file
        }, function(err, css) {
          if (err) return cb(err);
          try { var css = require('sqwish').minify(css) } catch (e) {};
          var fname = publicDir + file.split('.')[0] + '.css';
          gzipAsWell(css, fname, '.cgz', publicDir, function() {
            var diff = new Date().getTime() - start;
            console.log('Finished processing ' + file + ' in ' + diff + 'ms');
            cb.apply(this, arguments);
          });
        });

      // Wasn't a js or style file ¯\_(ツ)_/¯
      } else {
        cb();
      }
    }, callback);
  });
}

var gzipAsWell = function(src, fname, gext, out, callback) {
  gzip(src, function(err, buf) {
    if (err) return cb(err);
    async.parallel([
      async.apply(fs.writeFile, fname, src),
      async.apply(fs.writeFile, fname + gext, buf)
    ], callback);
  });
}
