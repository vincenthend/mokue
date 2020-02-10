import args from 'args'
import { log, logRequest } from './logger'
const chalk = require('chalk')
const path = require('path')
const httpserver = require('http')
const http = require('follow-redirects').http
const fs = require('fs')

function loadConfig(configFile){
  let config
  try {
    config = require(configFile)
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND'){
      log('Configuration file not found', 'error')
    } else {
      log('Invalid configuration file', 'error')
    }
  }
  return config
}


export default function main(argv) {
  args.option('port', 'The port on which the server will be running', 3000)
  args.option('config', 'The config file used', 'mokue.config.js')
  const arg = args.parse(argv)

  console.log(chalk.blue.bold('🍰 - Mokue v0.0.1'))
  console.log(`Config file loaded from ${chalk.bold(arg.config)}`)
  console.log(`Mokue server will be started at ${chalk.underline('http://127.0.0.1:'+arg.port)}\n`)

  // Load file
  const configFile = path.join(process.cwd(), arg.config)
  let config = loadConfig(configFile)
  fs.watchFile(configFile, () => {
    delete require.cache[configFile]
    log('Change in config file detected')
    config = loadConfig(configFile)
  })

  // Start server
  const server = httpserver.createServer((req, res) => {
    let config_data = config.route[`${req.method} ${req.url}`]
    let content
    try {
      if (config_data) {
        let content_type
        if(config_data.data){
          delete require.cache[path.join(process.cwd(), config_data.data)]
          content = require(path.join(process.cwd(), config_data.data))
          if(typeof content === 'object'){
            content_type = 'application/json'
            content = JSON.stringify(content)
          } else {
            content_type = 'text/plain'
            content = content.toString()
          }
        }
        // TODO: do action
        res.writeHead(200, {
          'Content-Type': content_type,
          'Content-Length': content ? Buffer.byteLength(content) : 0
        })
        res.write(content)
        res.end()
      } else {
        // Not found in config
        if(config.target){
          let url = new URL(req.url, config.target)
          let proxy = http.request(url, {
            headers: { ...req.headers, host: url.host, },
            method: req.method,
          }, function (r) {
            res.writeHead(r.statusCode, r.headers)
            r.pipe(res, {
              end: true
            })
          })
          req.pipe(proxy, {
            end: true
          });
        } else {
          content = 'Not Found'
          res.writeHead(404, { 'Content-Type': 'text/plain', 'Content-Length': content.length })
          res.write(content)
          res.end()
        }
      }
    } catch (e) {
      res.writeHead(503, { 'Content-Type': 'text/plain'})
      res.end()
    }
    logRequest(req, res)
  })
  server.listen(arg.port)

  process.on('SIGINT', () => {
    server.close()
    console.log('\nExiting...')
    process.exit()
  })
}
