var exec = require('child_process').exec,
    fs = require('fs');

describe('ezel-assets', function() {

  beforeEach(function(done) {
    exec('rm -rf test/assets/public', function(err) {
      exec('mkdir -p test/assets/public', function(err) {
        done(err);
      });
    });
  });

  it('generates CSS assets', function(done) {
    exec(
      'node bin/ezel-assets.js test/assets/ test/public/assets/',
      function(err, stdout, stderr) {
        fs.readFileSync(__dirname + '/public/assets/foo.css').toString()
          .should.equal('h1{color:#00f}body{color:#f00}');
        done();
      }
    )
  });

  it('generates JS assets', function(done) {
    exec(
      'node bin/ezel-assets.js test/assets/ test/public/assets/',
      function(err, stdout, stderr) {
        fs.readFileSync(__dirname + '/public/assets/bar.js').toString()
          .should.containEql('MODULE_NOT_FOUND');
        done();
      }
    )
  });

});