import shimmer from 'shimmer';

function start(apm, Subscription) {
  function wrapSubscription(subscriptionProto) {
    shimmer.wrap(subscriptionProto, '_runHandler', function(original) {
      return function(...args) {
        const transaction = apm.currentTransaction;
        if (transaction) {
          this.__transaction = transaction;
        }
        return original.apply(this, args);
      };
    });

    shimmer.wrap(subscriptionProto, 'ready', function(original) {
      return function(...args) {
        const transaction = this.__transaction;
        if (transaction) {
          if (transaction.__span) {
            transaction.__span.end();
          }
          transaction.end();
          this.__transaction = null;
        }

        return original.apply(this, args);
      };
    });

    shimmer.wrap(subscriptionProto, 'error', function(original) {
      return function(err) {
        const transaction = this.__transaction;
        if (transaction) {
          if (transaction.__span) {
            transaction.__span.end();
          }
          apm.captureError(err);
          transaction.end();
        }

        return original.call(this, err);
      };
    });

    // tracking the pub/sub operations
    // ['added', 'changed', 'removed'].forEach(function(funcName) {
    //   const originalFunc = subscriptionProto[funcName];
    //   subscriptionProto[funcName] = function(collectionName, id, fields) {
    //     const transaction = apm.startTransaction(
    //       `${collectionName}:${funcName}`,
    //       'sub - operations'
    //     );
    //     const res = originalFunc.call(this, collectionName, id, fields);

    //     transaction.end(JSON.stringify(fields));
    //     return res;
    //   };
    // });
  }

  wrapSubscription(Subscription.prototype);
}

module.exports = start;
