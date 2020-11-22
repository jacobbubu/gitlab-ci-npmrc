#!/usr/bin/env node
const { writeNpmrc } = require('../dist/index.js')

const pkgFile = process.argv[2]
if (!pkgFile) {
  console.error('Please provide the path to ".npmrc" file. example: change-pkg-registry ./package.json')
  process.exit(-1)
} else {
  if (!writeNpmrc(pkgFile)) {
    process.exit(-1)
  }
}

