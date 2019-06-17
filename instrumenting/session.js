import { Session } from '../meteorx';

function start(apm) {
  function wrapSession(sessionProto) {
    const originalProcessMessage = sessionProto.processMessage;
    sessionProto.processMessage = function(msg) {
      if (msg.msg === 'method' || msg.msg === 'sub') {
        const name = msg.msg === 'method' ? msg.method : msg.name;
        const type = msg.msg;
        const transaction = apm.startTransaction(name, type);

        apm.setCustomContext(msg.params || {});
        apm.setUserContext({ id: this.userId || 'Not authorized' });

        const waitTimeSpan = apm.startSpan('wait');
        transaction.__span = waitTimeSpan;
        msg.__transaction = transaction;
      }

      const result = originalProcessMessage.call(this, msg);

      return result;
    };

    // adding the method context to the current fiber
    const originalMethodHandler = sessionProto.protocol_handlers.method;
    sessionProto.protocol_handlers.method = function(msg, unblock) {
      const self = this;

      if (msg.__transaction) {
        // some tracking span created before
        if (msg.__transaction.__span) {
          msg.__transaction.__span.end();
          msg.__transaction.__span = null;
        }
      }
      const execSpan = apm.startSpan('execution');
      const response = originalMethodHandler.call(self, msg, unblock);

      execSpan.end();
      msg.__transaction.end(JSON.stringify(response));
      return response;
    };

    // to capture the currently processing message
    const originalSubHandler = sessionProto.protocol_handlers.sub;
    sessionProto.protocol_handlers.sub = function(msg, unblock) {
      const self = this;

      if (msg.__transaction) {
        if (msg.__transaction.__span) {
          msg.__transaction.__span.end();
        }
      }

      const execSpan = apm.startSpan('execution');
      msg.__transaction.__span = execSpan;

      const response = originalSubHandler.call(self, msg, unblock);

      return response;
    };

    // to capture the currently processing message
    const originalUnSubHandler = sessionProto.protocol_handlers.unsub;
    sessionProto.protocol_handlers.unsub = function(msg, unblock) {
      if (msg.__transaction && msg.__transaction.__span) {
        msg.__transaction.__span.end();
        msg.__transaction.__span = apm.startSpan('execution');
      }

      const response = originalUnSubHandler.call(this, msg, unblock);

      if (msg.__transaction) {
        if (msg.__transaction.__span) {
          msg.__transaction.__span.end();
        }
        msg.__transaction.end();
      }
      return response;
    };
  }

  wrapSession(Session.prototype);
}

module.exports = start;
