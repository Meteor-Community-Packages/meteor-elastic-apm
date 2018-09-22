import { HTTP } from 'meteor/http';
import http from 'http';
import https from 'https';
import url from 'url';

function start(apm){
  const protocolRequestMethods = {
    'http': http.request,
    'https': https.request
  }

  const newRequestFn = function(protocol, options, callback){
    // we don't want to catch elastic requests, it causes recursive requests handling
    const userAgent = ((options && options.headers) ? options.headers['User-Agent'] : '') || '';
    if(userAgent.includes('elastic-apm')){
      return protocolRequestMethods[protocol].call(this, options, callback);
    }

    const apmOptions = (typeof options === 'string') ? url.parse(options) : options;
    const eventName = `${apmOptions.method}:${protocol}//${apmOptions.headers.host}${apmOptions.path}`
    const eventType = "http.outcoming";
    const transaction = apm.currentTransaction || apm.startTransaction(eventName, eventType);
    const span = apm.startSpan(eventName, 'http');

    transaction.__span = span;
    const request = protocolRequestMethods[protocol].call(this, options, callback);

    const requestEnd = function(error){
      if(error){
        apm.captureError(error);
      }
      if(transaction){
        if(transaction.__span){
          transaction.__span.end();
        }
        if(transaction.type === "http.outcoming"){
          transaction.end();
        }
      }
    }

    request.on('error', requestEnd);
    request.on('response', function (response) {
      response.on('end', requestEnd);
      response.on('error', requestEnd);
    });

    return request;
  };
  http.request = newRequestFn.bind(http, 'http');

  // monitor incoming http request
  WebApp.connectHandlers.use('/', function(req, res, next){
    const transaction = apm.startTransaction(`${req.method}:${req.url}`, "http.incoming");
    const span = apm.startSpan("execution");

    res.on('finish', () => {
      span.end();
      transaction.__span = apm.startSpan("sending");
    });
    res.socket.on('close', () => {
      if(transaction){
        if(transaction.__span){
          transaction.__span.end();
        }
        transaction.end();
      }
    });

    next();
  });
}

module.exports = start;
