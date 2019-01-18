function start(apm) {
  Object.keys(Meteor.default_server.method_handlers).forEach(methodName => {
    const handler = Meteor.default_server.method_handlers[methodName];
    wrapMethodHanderForErrors(
      methodName,
      handler,
      Meteor.default_server.method_handlers
    );
  });

  var originalMeteorMethods = Meteor.methods;
  Meteor.methods = function(methodMap) {
    Object.keys(methodMap).forEach(methodName => {
      const handler = methodMap[methodName];
      wrapMethodHanderForErrors(methodName, handler, methodMap);
    });
    originalMeteorMethods(methodMap);
  };

  function wrapMethodHanderForErrors(name, originalHandler, methodMap) {
    methodMap[name] = function() {
      try {
        return originalHandler.apply(this, arguments);
      } catch (ex) {
        if (ex) {
          // sometimes error may be just an string or a primitive
          // in that case, we need to make it a psuedo error
          if (typeof ex !== "object") {
            ex = { message: ex, stack: ex };
          }
          // Now we are marking this error to get tracked via methods
          // But, this also triggers a Meteor.debug call and
          // it only gets the stack
          // We also track Meteor.debug errors and want to stop
          // tracking this error. That's why we do this
          // See Meteor.debug error tracking code for more
          ex.stack = { stack: ex.stack, source: "method" };
        }
        apm.captureError(ex);
        throw ex;
      }
    };
  }
}

module.exports = start;
