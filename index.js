/* eslint no-unused-vars: 0 */
/* eslint no-undef: 0 */
'use strict';

require('dotenv').config();

const defaults = require('./defaults');

const WORKERS = process.env.WEB_CONCURRENCY || require('os').cpus().length;

const {
  ADDITIONAL_HEADERS = null,
  CACHE_TTL = defaults.cacheTtl,
  HEROKU_APP_NAME = '',
  LOG_LEVEL = 'error',
  NODE_ENV,
  PORT = defaults.appPort,
  PROXY_URL,
  REMOVE_HEADERS = '',
  WHITELIST_DOMAINS = ''
} = process.env;

const
  http = require('https'),
  Logger = require('heroku-logger').Logger,
  path = require('path'),
  request = require('request-promise'),
  throng = require('throng');

const logger = new Logger({ level: LOG_LEVEL});

const proxyURL = (HEROKU_APP_NAME !== '') ? `https://${HEROKU_APP_NAME}.herokuapp.com/`
  : (PROXY_URL !== '') ? PROXY_URL
    : `${defaults.host}:${PORT}/`;

if (NODE_ENV !== 'test') {
  throng({
    workers: WORKERS,
    lifetime: Infinity,
    master: startMaster,
    start: startWorker
  });
} else {
  startWorker(1);
}

//This will only be called once
function startMaster() {
  logger.info('Started master');
}

function startWorker(workerId) {
  
  http.createServer((req, res) => {
	  
    if (req.url === '/') {
      const _myDate = (new Date()).toLocaleString();
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(_myDate);
      res.end();
      return;
    }
    
    request({
      uri: `http://${req.url.replace('/', '')}`,
      method: req.method,
      resolveWithFullResponse: true
    })
      .then((response) => {
    	
        const proxyHeaders = ADDITIONAL_HEADERS
        	? JSON.parse(ADDITIONAL_HEADERS)
        	: {};
        
        let responseHeaders = response.headers;
        
        REMOVE_HEADERS.split(',').forEach((item) => {
        	if (item in responseHeaders) {
        		delete responseHeaders[item.toString()];
        	}
        });
        
        const headers = Object.assign({}, responseHeaders, proxyHeaders);
          
        res.writeHead(response.statusCode, headers);
        res.write(response.body);
        res.end();
      })
      .catch((err) => {
        logger.error(err + '');
        res.writeHead(500, {});
        res.write(err + '');
        res.end();
      });
      
  }).listen(PORT);

  logger.info(`Node.js web server is running at port ${PORT} / ${workerId}`);
}
