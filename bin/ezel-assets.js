#!/usr/bin/env node

var cluster = require('cluster');
var chunk = function(array, chunkSize) {
  return [].concat.apply([], array.map(function(el, i) {
    return i % chunkSize ? [] : [array.slice(i, i + chunkSize)]
  }));
}

// Master
if (cluster.isMaster) {
  var fs = require('fs'),
      assetsDir,
      publicDir,
      transforms = process.argv[4] && process.argv[4].split(',') || [],
      globalTransforms = process.argv[5] && process.argv[5].split(',') || [],
      cpuCount = require('os').cpus().length,
      start = new Date().getTime(),
      workerFinishedCount = 0;

  // Defaults
  ['caching-coffeeify', 'babelify', 'jadeify', 'cssify', 'uglifyify'].forEach(function(t) {
    if(transforms.indexOf(t) < 0) transforms.push(t)
  });
  [ 'deamdify'].forEach(function(t) {
    if(globalTransforms.indexOf(t) < 0) globalTransforms.push(t)
  });
  assetsDir = process.argv[2] ?
    process.cwd() + '/' + process.argv[2] : process.cwd() + '/assets/';
  publicDir = process.argv[3] ?
    process.cwd() + '/' + process.argv[3] : process.cwd() + '/public/assets/';

  // Get the files in the assetDir and split the processing by number of cpus
  console.log('Generating assets. ' + assetsDir + ' to ' + publicDir  + '...');
  fs.readdir(assetsDir, function(err, files) {
    var chunks = chunk(files, Math.ceil(files.length / cpuCount));
    chunks.forEach(function(chunk) {
      cluster.fork({
        FILES: chunk.join(','),
        ASSETS_DIR: assetsDir,
        PUBLIC_DIR: publicDir,
        TRANSFORMS: transforms.join(','),
        GLOBAL_TRANSFORMS: globalTransforms.join(',')
      });
    });
  });

  // Finish after all workers exit
  cluster.on('exit', function (worker) {
    if (worker.process.exitCode == 1) {
      for (var id in cluster.workers) cluster.workers[id].kill();
      process.exitCode = 1;
    }
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
    assetsDir: process.env.ASSETS_DIR,
    publicDir: process.env.PUBLIC_DIR,
    transforms: process.env.TRANSFORMS.split(','),
    globalTransforms: process.env.GLOBAL_TRANSFORMS.split(',')
  }, function(err) {
    if (err) {
      console.error('Error generating assets: ' + err);
      process.exit(1);
    } else {
      process.exit();
    }
   });
}
