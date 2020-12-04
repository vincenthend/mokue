import args from 'args'
import { log, logRequest } from './logger'
const chalk = require('chalk')
const path = require('path')
const httpserver = require('http')
const http = require('follow-redirects').http
const fs = require('fs')
const notificationCenter = require('node-notifier/notifiers/notificationcenter')

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
    let config_data = config.route[`${req.method} ${req.url.split('?')[0]}`]

    function forwardRequest() {
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
    }

    function writeResponse(data){
      res.writeHead(data[0], data[1])
      res.write(data[2])
      res.end()
    }

    function loadContent(file){
      let res_arr = []
      delete require.cache[path.join(process.cwd(), file)]
      let content
      try {
        content = require(path.join(process.cwd(), file))
      } catch (e) {
        content = { success: false }
        notificationCenter().notify({title: 'Invalid JSON', message: `Invalid JSON Mock Response ${req.url}`})
      }
      res_arr[0] = 200
      if(typeof content === 'object'){
        res_arr[1] = 'application/json'
        res_arr[2] = JSON.stringify(content)
      } else {
        res_arr[1] = 'text/plain'
        res_arr[2] = content.toString()
      }
      return res_arr
    }

    function detectUndefined(req, data){
      if(req.url.includes('undefined')){
        notificationCenter().notify({title: 'Undefined in URL detected', message: `Undefined found in ${req.url}`})
      }
      if(data.toString().includes('undefined')){
        notificationCenter().notify({title: 'Undefined in payload detected', message: `Undefined found in ${req.url} payload`})
      }
    }

    // Detect undefined in request
    let data = []
    req.on('data', chunk => {
      data.push(chunk)
    })
    req.on('end', () => {
      detectUndefined(req, data)
    })

    try {
      // If there is a configuration found for the url
      if (config_data) {
        let res = []
        // Check the data
        if(config_data.data){
          if(typeof config_data.data === 'function'){
            res = config_data.data(req.url, forwardRequest)
            if(typeof res === 'string') {
              res = loadContent(res)
            }
          } else {
            res = loadContent(config_data.data)
          }
        } else {
          throw new Error('Data cannot be empty!')
        }

        // Check if there is a delay
        let delay = 0
        if(config_data.delay){
          if(typeof config_data.delay === 'number') {
            delay = config_data.delay
          } else if (typeof config_data.delay === 'function') {
            delay = config_data.delay()
          }
        }

        // Write response after delay
        if(Array.isArray(res) && res.length === 3) {
          setTimeout(() => {
            writeResponse([res[0], {
              'Content-Type': res[1],
              'Content-Length': res[2] ? Buffer.byteLength(res[2]) : 0
            }, res[2]])
          }, delay)
        }
      } else {
        // Not found in config
        if(config.target){
          forwardRequest()
        } else {
          let content = 'Not Found'
          writeResponse([404, { 'Content-Type': 'text/plain', 'Content-Length': content.length }, content])
        }
      }
    } catch (e) {
      console.log(e)
      writeResponse([503, { 'Content-Type': 'text/plain', 'Content-Length': e.message.length }, `Mokue error ${e.message}`])
    }
    logRequest(req, res)
  })
  server.listen(arg.port)

  process.on('SIGINT', () => {
    server.close()
    console.log('\nExiting...')
    process.exit()
  })

  process.on('uncaughtException', () => {
    notificationCenter().notify({title: 'Mokue - Uncaught Exception', message: `Uncaught exception!`})
  })
}
