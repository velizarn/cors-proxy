# cors-proxy

## Usage

Sample configuration for non-AMP CORS proxy

```
PORT=5000
CACHE_TTL=3600
LOG_LEVEL=info
ADDITIONAL_HEADERS={"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "*", "Access-Control-Allow-Headers": "X-Requested-With"}
AMP_PROXY_ACTOR=false
```

Sample configuration for AMP CORS proxy

```
PORT=5000
CACHE_TTL=3600
LOG_LEVEL=info
AMP_PROXY_ACTOR=true
AMP_ALLOWED_ORIGINS=https://www.example.com,https://www.example.com.cdn.ampproject.org,https://www.example.com.amp.cloudflare.com,https://cdn.ampproject.org
AMP_ALLOWED_SOURCE_ORIGIN=https://www.example.com
ADDITIONAL_HEADERS={"Access-Control-Allow-Credentials": "true", "Access-Control-Expose-Headers": "AMP-Access-Control-Allow-Source-Origin"}
WHITELIST_DOMAINS=example.com,www.example.com
```

## Useful resources

- https://www.ampproject.org/docs/fundamentals/amp-cors-requests
- https://www.npmjs.com/package/request-promise
- https://devcenter.heroku.com/articles/config-vars
- https://devcenter.heroku.com/articles/heroku-local
- https://nodejs.org/docs/latest/api/url.html
- https://expressjs.com/en/api.html
- https://www.tutorialsteacher.com/nodejs/create-nodejs-web-server
