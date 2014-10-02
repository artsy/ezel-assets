var fs = require('fs'),
    path = require('path');

var errExit = function(err) {
  if (err) {
    console.error('Error with generating assets: ' + err);
    process.exit(1);
  }
}

module.exports = function(assetsDir, publicDir) {
  console.log('Generating assets. ' + assetsDir + ' to ' + publicDir  + '...');
  var start = new Date().getTime();
  process.on('exit', function() {
    console.log('Finished in ' + (new Date().getTime() - start) + 'ms');
  });

  fs.readdirSync(assetsDir).forEach(function(file) {

    // Browserify + Transforms
    var browserify = null;
    try { var browserify = require('browserify'); } catch (e) {};
    if (browserify &&
        path.extname(file) == '.js' || path.extname(file) == '.coffee') {
      var b = browserify().add(assetsDir + file);
      try { b.transform(require('caching-coffeeify')) } catch (e) {};
      try { b.transform(require('jadeify')) } catch (e) {};
      try { b.transform(require('uglifyify')) } catch (e) {};
      b.bundle(function(err, buf) {
        if (err) return errExit(err);
        fs.writeFileSync(publicDir + file.split('.')[0] + '.js', buf);
      });
    }

    // Stylus + Sqwish
    var stylus = null;
    try { var stylus = require('stylus'); } catch (e) {};
    if (stylus && path.extname(file) == '.styl') {
      stylus.render(fs.readFileSync(assetsDir + file).toString(), {
        filename: assetsDir + file
      }, function(err, css) {
        if (err) return errExit(err);
        try { var css = require('sqwish').minify(css) } catch (e) {};
        fs.writeFileSync(publicDir + file.split('.')[0] + '.css', css);
      });
    }
  });
}