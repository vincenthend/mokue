#!/usr/bin/env node

require = require('esm')(module)
const main = require('../src/cli.js').default

main(process.argv)
