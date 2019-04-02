'use strict';

require('dotenv').config();

const {
  ADDITIONAL_HEADERS = null,
  AMP_ALLOWED_ORIGINS = '',
  AMP_ALLOWED_SOURCE_ORIGIN,
  AMP_PROXY_ACTOR = 'false',
  LOG_LEVEL = 'error',
  WHITELIST_DOMAINS = ''
} = process.env;
  
const
  Logger = require('heroku-logger').Logger,
  logger = new Logger({ level: LOG_LEVEL});

const middlewareDefaultUri = (req, res, next) => {
  if (req.originalUrl === '/') {
    res.status(200);
    res.send((new Date()).toLocaleString());
    res.end();
    return;
  }
  next();
};

const middlewareTargetUrl = (req, res, next) => {
  req.app.locals.requestedUrl = `${req.protocol}://${req.originalUrl.replace('/', '')}`;
  return next();
};

const middlewareProxyHeaders = (req, res, next) => {
  req.app.locals.proxyHeaders = ADDITIONAL_HEADERS
    ? JSON.parse(ADDITIONAL_HEADERS)
    : {};
  return next();
};

const middlewareWhitelistDomains = (req, res, next) => {
  
  try {
        
    const urlObject = (new URL(req.app.locals.requestedUrl));
        
    if (WHITELIST_DOMAINS !== '' && !WHITELIST_DOMAINS.includes(urlObject.hostname)) {
      res.status(400);
      res.send('Bad Request');
      res.end();
      return;
    }
          
  } catch (err) {
    logger.error(err + '');
    res.status(400);
    res.send('Bad Request');
    res.end();
    return;
  }

  next();
};

const middlewareAmpProxy = (req, res, next) => {
  
  if (AMP_PROXY_ACTOR === 'false') {
    return next();
  }
  
  const unauthorized = 'Unauthorized Request';
    
  let origin;
    
  const allowedOrigins = AMP_ALLOWED_ORIGINS.replace(', ', ',').split(',');
    
  const sourceOrigin = req.query.__amp_source_origin;
    
  // If same origin
  if (req.headers['amp-same-origin'] === 'true') {
    origin = sourceOrigin;
    // If allowed CORS origin & allowed source origin
  } else if (allowedOrigins.indexOf(req.headers.origin) !== -1 && sourceOrigin === AMP_ALLOWED_SOURCE_ORIGIN) {
    origin = req.headers.origin;
  } else {
    res.statusCode = 401;
    res.end(JSON.stringify({message: unauthorized}));
    throw unauthorized;
  }
    
  req.app.locals.proxyHeaders['Access-Control-Allow-Origin'] = origin;
  req.app.locals.proxyHeaders['AMP-Access-Control-Allow-Source-Origin'] = sourceOrigin;
  
  next();
};

module.exports = {
  middlewareDefaultUri,
  middlewareTargetUrl,
  middlewareProxyHeaders,
  middlewareAmpProxy,
  middlewareWhitelistDomains
};
