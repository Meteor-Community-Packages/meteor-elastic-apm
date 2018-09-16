import { HTTP } from 'meteor/http';

function start(apm){
  // monitor outcoming http requests
  const originalCall = HTTP.call;
  HTTP.call = function(method, url, options, callback) {
    let transaction = null;
    let span = null;
    if(!apm.currentTransaction){
      transaction = apm.startTransaction(url, "http.outcoming");
    } else {
      span = apm.startSpan(`http:${url}`, "http");
    }

    let asyncCallback;
    if(callback){
      asyncCallback = function(){
        if(transaction){
          transaction.end(arguments);
        }
        if(span){
          span.end();
        }
        callback.apply(null, arguments);
      };
    }
    try {
      const response = originalCall.call(HTTP, method, url, options, asyncCallback);

      if(!asyncCallback){
        if(transaction){
          transaction.end(arguments);
        }
        if(span){
          span.end();
        }
      }
      return response;
    } catch(ex) {
      if(transaction){
        transaction.end(arguments);
      }
      if(span){
        span.end();
      }

      throw ex;
    }
  };

  // monitor incoming http request
  WebApp.connectHandlers.use('/', function(req, res, next){
    const transaction = apm.startTransaction(`${req.method}:${req.url}`, "http.incoming");
    const span = apm.startSpan("execution");

    res.on('finish', () => {
      span.end();
      transaction.__span = apm.startSpan("close");
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
