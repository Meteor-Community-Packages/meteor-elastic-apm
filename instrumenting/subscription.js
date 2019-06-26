import shimmer from 'shimmer';

function start(agent, Subscription) {
  function wrapSubscription(subscriptionProto) {
    shimmer.wrap(subscriptionProto, '_runHandler', function(original) {
      return function(...args) {
        this.__transaction = agent.currentTransaction;
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

          const { _documents } = this;

          const sentCollectionDocs = Object.keys(_documents).reduce((acc, collectionName) => {
            const keys = Object.keys(_documents[collectionName]);
            acc[collectionName] = keys.length;

            return acc;
          }, {});

          transaction.addLabels(sentCollectionDocs);
          transaction.end('ready');
          this.__transaction = undefined;
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
          transaction.addLabels({
            exception: JSON.stringify({
              message: error.message,
              stack: err.stack
            })
          });

          transaction.end('fail');
          this.__transaction = undefined;
        }

        return original.call(this, err);
      };
    });
  }

  wrapSubscription(Subscription.prototype);
}

module.exports = start;
