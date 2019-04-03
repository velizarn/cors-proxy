/* eslint no-unused-vars: 0 */
/* eslint no-undef: 0 */
'use strict';

require('dotenv').config();

const defaults = require('./defaults');

const WORKERS = process.env.WEB_CONCURRENCY || require('os').cpus().length;

const {
  CACHE_TTL = defaults.cacheTtl,
  LOG_LEVEL = 'error',
  NODE_ENV,
  PORT = defaults.appPort,
  REMOVE_HEADERS = ''
} = process.env;
  
const
  express = require('express'),
  helmet = require('helmet'),
  Logger = require('heroku-logger').Logger,
  request = require('request-promise'),
  throng = require('throng');

const logger = new Logger({ level: LOG_LEVEL});

const {
  middlewareDefaultUri,
  middlewareHTTPMethod,
  middlewareTargetUrl,
  middlewareProxyHeaders,
  middlewareAmpProxy,
  middlewareWhitelistDomains
} = require('./functions');
 
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

// This will only be called once
function startMaster() {
  logger.info('Started master');
}

function startWorker(workerId) {
  
  const app = express();
  
  app
    .use(helmet())
    .use(middlewareDefaultUri)
    .use(middlewareHTTPMethod)
    .use(middlewareTargetUrl)
    .use(middlewareProxyHeaders)
    .use(middlewareAmpProxy)
    .use(middlewareWhitelistDomains);
  
  app.disable('etag');
  app.disable('x-powered-by');
  
  app.all('*', (req, res) => {
    
    const originalHeaders = req.headers;
    
    delete originalHeaders.host;
    
    request({
      uri: req.app.locals.requestedUrl,
      method: req.method,
      headers: originalHeaders,
      resolveWithFullResponse: true
    })
      .then((response) => {
      
        const responseHeaders = response.headers;
        
        REMOVE_HEADERS.split(',').forEach((item) => {
          if (item in responseHeaders) {
            delete responseHeaders[item.toString()];
          }
        });
        
        const headers = Object.assign({}, responseHeaders, req.app.locals.proxyHeaders);
        
        res.status(response.statusCode);
        res.set(headers);
        res.send(response.body);
        res.end();
      })
      .catch((err) => {
        logger.error(`${err  }`);
        res.status(500);
        res.send(`${err  }`);
        res.end();
      });
      
  });
  
  module.exports = app.listen(PORT, () => logger.info(`Listening on ${ PORT } / ${workerId}`));
}
