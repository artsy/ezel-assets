#!/usr/bin/env node
const cluster = require('cluster')
const fs = require('fs')
const ezelAssets = require('../')

const chunks = (assetsDir, total) => {
  const files = fs.readdirSync(assetsDir)
  const chunkSize = Math.ceil(files.length / total)
  return [].concat.apply([], files.map((el, i) =>
    i % chunkSize ? [] : [files.slice(i, i + chunkSize)]
  ))
}

const getOptions = () => {
  const transforms = process.argv[4] && process.argv[4].split(',') || []
  const globalTransforms = process.argv[5] && process.argv[5].split(',') || []

  // Defaults
  ;['caching-coffeeify', 'babelify', 'jadeify', 'cssify', 'uglifyify'].forEach(function (t) {
    if (transforms.indexOf(t) < 0) transforms.push(t)
  })
  ;['deamdify'].forEach(function (t) {
    if (globalTransforms.indexOf(t) < 0) globalTransforms.push(t)
  })
  const assetsDir = process.argv[2]
    ? process.cwd() + '/' + process.argv[2]
    : process.cwd() + '/assets/'
  const publicDir = process.argv[3]
    ? process.cwd() + '/' + process.argv[3]
    : process.cwd() + '/public/assets/'
  return { assetsDir, publicDir, transforms, globalTransforms }
}

// Circle CI
if (process.env.CIRCLE_NODE_INDEX) {
  const { assetsDir, publicDir, transforms, globalTransforms } = getOptions()
  const total = Number(process.env.CIRCLE_NODE_TOTAL)
  const index = Number(process.env.CIRCLE_NODE_INDEX)
  ezelAssets({
    files: chunks(assetsDir, total)[index],
    assetsDir,
    publicDir,
    transforms,
    globalTransforms
  }, function (err) {
    if (err) {
      console.error('Error generating assets: ' + err)
      process.exit(1)
    } else {
      process.exit()
    }
  })

// Master
} else if (cluster.isMaster) {
  const cpuCount = require('os').cpus().length
  const { assetsDir, publicDir, transforms, globalTransforms } = getOptions()

  // Get the files in the assetDir and split the processing by number of cpus
  console.log('Generating assets. ' + assetsDir + ' to ' + publicDir + '...')
  chunks(assetsDir, cpuCount).forEach((chunk) => {
    cluster.fork({
      FILES: chunk.join(','),
      ASSETS_DIR: assetsDir,
      PUBLIC_DIR: publicDir,
      TRANSFORMS: transforms.join(','),
      GLOBAL_TRANSFORMS: globalTransforms.join(',')
    })
  })

  // Finish after all workers exit
  const start = new Date().getTime()
  let workerFinishedCount = 0
  cluster.on('exit', function (worker) {
    if (worker.process.exitCode === 1) {
      for (const id in cluster.workers) cluster.workers[id].kill()
      process.exitCode = 1
    }
    workerFinishedCount++
    if (workerFinishedCount === cpuCount) {
      console.log('Finished in ' + (new Date().getTime() - start) + 'ms')
      process.exit()
    }
  })

// Worker
} else {
  ezelAssets({
    files: process.env.FILES.split(','),
    assetsDir: process.env.ASSETS_DIR,
    publicDir: process.env.PUBLIC_DIR,
    transforms: process.env.TRANSFORMS.split(','),
    globalTransforms: process.env.GLOBAL_TRANSFORMS.split(',')
  }, function (err) {
    if (err) {
      console.error('Error generating assets: ' + err)
      process.exit(1)
    } else {
      process.exit()
    }
  })
}
