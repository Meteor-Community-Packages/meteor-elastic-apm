/* eslint-disable no-undef */
import shimmer from 'shimmer';

function start(agent) {
  function wrapMethodHanderForErrors(name, originalHandler, methodMap) {
    methodMap[name] = function(...args) {
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
  }

  const methodHandlers = Meteor.default_server.method_handlers;
  Object.keys(methodHandlers).forEach(methodName => {
    const handler = methodHandlers[methodName];
    wrapMethodHanderForErrors(methodName, handler, methodHandlers);
  });

  shimmer.wrap(Meteor, 'methods', function(original) {
    return function(methodsMap) {
      Object.keys(methodsMap).forEach(methodName => {
        const handler = methodMap[methodName];
        wrapMethodHanderForErrors(methodName, handler, methodMap);
      });

      return original.apply(this, [methodsMap]);
    };
  });
}

module.exports = start;
