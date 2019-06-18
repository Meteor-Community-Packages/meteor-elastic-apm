import shimmer from 'shimmer';

function start(agent, Meteor) {
  function wrapMethodHanderForErrors(name, methodMap) {
    shimmer.wrap(methodMap, name, function(originalHandler) {
      return function(...args) {
        try {
          return originalHandler.apply(this, args);
        } catch (ex) {
          if (ex) {
            if (typeof ex !== 'object') {
              // eslint-disable-next-line no-ex-assign
              ex = { message: ex, stack: ex };
            }
            ex.stack = { stack: ex.stack, source: 'method' };
          }
          agent.captureError(ex);
          throw ex;
        }
      };
    });
  }

  const methodHandlers = Meteor.default_server.method_handlers;
  Object.keys(methodHandlers).forEach(methodName =>
    wrapMethodHanderForErrors(methodName, methodHandlers)
  );

  shimmer.wrap(Meteor, 'methods', function(original) {
    return function(methodsMap) {
      Object.keys(methodsMap).forEach(methodName =>
        wrapMethodHanderForErrors(methodName, methodsMap)
      );

      return original.apply(this, [methodsMap]);
    };
  });
}

module.exports = start;
