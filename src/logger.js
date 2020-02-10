const chalk = require('chalk')

function log(message, type = 'info'){
    if(type === 'error') {
        console.log(`${new Date()} ${chalk.red.inverse('ERROR')} ${message}`)
    } else {
        console.log(`${new Date()} ${chalk.inverse('INFO')} ${message}`)
    }
}

function logRequest(req, res){
    let url = req.url.length > 64 ? req.url.slice(0,64) + '...' : req.url
    if(res.statusCode >= 400){
        console.log(`${chalk.gray(new Date())} ${chalk.red.inverse(res.statusCode)} ${req.method} ${url}`)
    } else {
        console.log(`${chalk.gray(new Date())} ${chalk.green.inverse(res.statusCode)} ${req.method} ${url}`)
    }
}

module.exports = {
    log,
    logRequest
}
