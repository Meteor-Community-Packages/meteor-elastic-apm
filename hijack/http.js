import { HTTP } from 'meteor/http';

function start(apm){
  const originalCall = HTTP.call;

  HTTP.call = function(method, url, options, callback) {
    let transaction = null;
    let span = null;
    if(!apm.currentTransaction){
      transaction = apm.startTransaction(url, "http.call");
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
}

module.exports = start;
