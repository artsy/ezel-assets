#!/usr/bin/env node

var assetsDir,
    publicDir,
    transforms = process.argv[4] && process.argv[4].split(',') || [],
    start = new Date().getTime(),
    ezelAssets = require('../');

// Defaults
['caching-coffeeify', 'uglifyify', 'jadeify', 'coffeeify'].forEach(function(t) {
  if(transforms.indexOf(t) < 0) transforms.push(t)
});
assetsDir = process.argv[2] ?
  process.cwd() + '/' + process.argv[2] : process.cwd() + '/assets/';
publicDir = process.argv[3] ?
  process.cwd() + '/' + process.argv[3] : process.cwd() + '/public/assets/';

// Start the generating
console.log('Generating assets. ' + assetsDir + ' to ' + publicDir  + '...');
ezelAssets({
  assetsDir: assetsDir,
  publicDir: publicDir,
  transforms: transforms
}, function(err) {
  if (err) {
    console.error('Error with generating assets: ' + err);
    return process.exit(1);
  }
  console.log('Finished in ' + (new Date().getTime() - start) + 'ms');
});