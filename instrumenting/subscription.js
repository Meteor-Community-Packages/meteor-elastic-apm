import shimmer from 'shimmer';

function start(agent, Subscription) {
  function wrapSubscription(subscriptionProto) {
    shimmer.wrap(subscriptionProto, '_runHandler', function(original) {
      return function(...args) {
        const transaction = agent.currentTransaction;
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
          agent.captureError(err);
          transaction.end();
          this.__transaction = null;
        }

        return original.call(this, err);
      };
    });

    // This is commented because this is not related to transactions and span.
    // It should be a metrics type, elastic agent do not expose it's metrics feature.
    // // tracking the pub/sub operations
    // ['added', 'changed', 'removed'].forEach(function(funcName) {
    //   shimmer.wrap(subscriptionProto, funcName, function(original) {
    //     return function(collectionName, id, fields) {
    //       const transaction = agent.startTransaction(
    //         `${collectionName}:${funcName}`,
    //         'sub - operations'
    //       );
    //       const res = original.call(this, collectionName, id, fields);

    //       transaction.end(JSON.stringify(fields));
    //       return res;
    //     };
    //   });
    // });
  }

  wrapSubscription(Subscription.prototype);
}

module.exports = start;
