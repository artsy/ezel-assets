#!/usr/bin/env node

var cluster = require('cluster'),
    assetsDir = process.cwd() + '/assets/',
    publicDir = process.cwd() + '/public/assets/';;

var chunk = function(array, chunkSize) {
  return [].concat.apply([], array.map(function(el, i) {
    return i % chunkSize ? [] : [array.slice(i, i + chunkSize)]
  }));
}

// Master
if (cluster.isMaster) {
    var fs = require('fs'),
        cpuCount = require('os').cpus().length,
        start = new Date().getTime(),
        workerFinishedCount = 0;

    console.log('Generating assets. ' + assetsDir + ' to ' + publicDir  + '...');

    // Get the files in the assetDir and split the processing by number of cpus
    fs.readdir(assetsDir, function(err, files) {
      var chunks = chunk(files, Math.ceil(files.length / cpuCount));
      chunks.forEach(function(chunk) {
        cluster.fork({ FILES: chunk.join(',') });
      });
    });

    // Listen for dying workers
    cluster.on('exit', function (worker) {
      workerFinishedCount++
      if (workerFinishedCount == cpuCount) {
        console.log('Finished in ' + (new Date().getTime() - start) + 'ms');
        process.exit();
      }
    });

// Worker
} else {
  var ezelAssets = require('../');
  ezelAssets({
    files: process.env.FILES.split(','),
    assetsDir: assetsDir,
    publicDir: publicDir,
    transforms: ['caching-coffeeify', 'coffeeify', 'jadeify', 'deamdify',
      'cssify', 'uglifyify']
  }, function(err) {
    if (err) {
      console.error('Error generating assets: ' + err);
      process.exit(1);
    } else {
      process.exit();
    }
   });
}
