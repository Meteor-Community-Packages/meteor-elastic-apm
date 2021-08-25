import shimmer from 'shimmer';

function closeTransaction(agent, exception, result) {
  const { currentTransaction } = agent;
  if (currentTransaction) {
    if (currentTransaction.__span) {
      currentTransaction.__span.end();
      currentTransaction.__span = undefined;
    }

    if (exception) {
      agent.captureError(exception);
      currentTransaction.addLabels({
        status: 'fail',
        exception: JSON.stringify({
          stack: exception.stack,
          message: exception.message
        })
      });
    } else {
      currentTransaction.addLabels({
        status: 'success',
        result: JSON.stringify(result)
      });
    }

    currentTransaction.end(exception ? 'fail' : 'success');
  }
}

function start(agent, Meteor) {
  function wrapMethods(name, methodMap) {
    shimmer.wrap(methodMap, name, function(originalHandler) {
      return function(...args) {
        try {
          const result = originalHandler.apply(this, args);

          closeTransaction(agent, null, result);

          return result;
        } catch (ex) {
          if (typeof ex !== 'object') {
            // eslint-disable-next-line no-ex-assign
            ex = { message: ex, stack: ex };
          }
          ex.stack = { stack: ex.stack, source: 'method' };

          closeTransaction(agent, ex, null);
          throw ex;
        }
      };
    });
  }

  const methodHandlers = Meteor.server.method_handlers;
  Object.keys(methodHandlers).forEach(methodName => wrapMethods(methodName, methodHandlers));

  shimmer.wrap(Meteor, 'methods', function(original) {
    return function(methodsMap) {
      Object.keys(methodsMap).forEach(methodName => wrapMethods(methodName, methodsMap));

      return original.apply(this, [methodsMap]);
    };
  });
}

module.exports = start;
