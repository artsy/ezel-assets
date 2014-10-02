#!/usr/bin/env node

require('../')(
  process.cwd() + '/' + process.argv[2],
  process.cwd() + '/' + process.argv[3]
);