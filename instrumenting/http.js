import http from 'http';
import url from 'url';
import shimmer from 'shimmer';

import { HTTP, HTTP_OUTCOMING, HTTP_INCOMING, EXECUTION, SENDING } from '../constants';

function start(agent, WebApp) {
  // monitor outcoming http requests
  shimmer.wrap(http, 'request', function(original) {
    return function(options, callback) {
      // we don't want to catch elastic requests, it causes recursive requests handling
      const userAgent = (options && options.headers ? options.headers['User-Agent'] : '') || '';
      if (userAgent.includes('elastic-apm')) {
        return original.call(this, options, callback);
      }

      const apmOptions = typeof options === 'string' ? url.parse(options) : options;

      const { method, path } = apmOptions;
      let { host } = apmOptions;

      if (!host) host = apmOptions.hostname;

      const eventName = `${method}://${host}${path}`;
      const eventType = HTTP_OUTCOMING;
      const transaction = agent.currentTransaction || agent.startTransaction(eventName, eventType);
      const span = agent.startSpan(eventName, HTTP);

      transaction.__span = span;
      const request = original.call(this, options, callback);

      const requestEnd = function(error) {
        if (error) {
          agent.captureError(error);
        }
        if (transaction) {
          if (transaction.__span) {
            transaction.__span.end();
          }
          if (transaction.type === HTTP_OUTCOMING) {
            transaction.end();
          }
        }
      };

      request.on('error', requestEnd);
      request.on('response', function(response) {
        response.on('end', requestEnd);
        response.on('error', requestEnd);
      });

      return request;
    };
  });

  // monitor incoming http request
  WebApp.connectHandlers.use('/', function(req, res, next) {
    const transaction = agent.startTransaction(`${req.method}:${req.url}`, HTTP_INCOMING);
    const span = agent.startSpan(EXECUTION);

    res.on('finish', () => {
      span.end();
      transaction.__span = agent.startSpan(SENDING);
    });
    res.socket.on('close', () => {
      if (transaction) {
        if (transaction.__span) {
          transaction.__span.end();
        }
        transaction.end();
      }
    });

    next();
  });
}

module.exports = start;
