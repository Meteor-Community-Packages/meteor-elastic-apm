import shimmer from 'shimmer';

function start(apm, Session) {
  function wrapSession(sessionProto) {
    shimmer.wrap(sessionProto, 'processMessage', function(original) {
      return function(msg) {
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

        return original.call(this, msg);
      };
    });

    shimmer.wrap(sessionProto.protocol_handlers, 'method', function(original) {
      return function(msg, unblock) {
        if (msg.__transaction) {
          if (msg.__transaction.__span) {
            msg.__transaction.__span.end();
            msg.__transaction.__span = null;
          }
        }

        const execSpan = apm.startSpan('execution');
        const response = original.call(this, msg, unblock);

        execSpan.end();

        if (msg.__transaction) {
          msg.__transaction.end(JSON.stringify(response));
        }
        return response;
      };
    });

    shimmer.wrap(sessionProto.protocol_handlers, 'sub', function(original) {
      return function(msg, unblock) {
        const self = this;

        if (msg.__transaction) {
          if (msg.__transaction.__span) {
            msg.__transaction.__span.end();
          }
        }

        if (msg.__transaction) {
          msg.__transaction.__span = apm.startSpan('execution');
        }

        return original.call(self, msg, unblock);
      };
    });

    shimmer.wrap(sessionProto.protocol_handlers, 'unsub', function(original) {
      return function(msg, unblock) {
        if (msg.__transaction && msg.__transaction.__span) {
          msg.__transaction.__span.end();
          msg.__transaction.__span = apm.startSpan('execution');
        }

        const response = original.call(this, msg, unblock);

        if (msg.__transaction) {
          if (msg.__transaction.__span) {
            msg.__transaction.__span.end();
          }
          msg.__transaction.end();
        }
        return response;
      };
    });
  }

  wrapSession(Session.prototype);
}

module.exports = start;
