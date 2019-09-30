import shimmer from 'shimmer';

function start(agent, Session) {
  function wrapSession(sessionProto) {
    shimmer.wrap(sessionProto, 'processMessage', function(original) {
      return function(msg) {
        if (msg.msg === 'method' || msg.msg === 'sub') {
          const name = msg.msg === 'method' ? msg.method : msg.name;
          const type = msg.msg;
          const transaction = agent.startTransaction(name, type);

          agent.setCustomContext(msg.params || {});
          agent.setUserContext({ id: this.userId || 'Not authorized' });

          // _FilesCollectionWrite_ is a prefix for meteor-methods used by meteor/ostrio:files. It sends files via DDP to the server. Monitoring it would send the file - byte-serialized - on to the monitoring system.
          if (transaction && (!msg.method || !msg.method.startsWith('_FilesCollectionWrite_'))) {
            transaction.addLabels({
              params: JSON.stringify(msg.params)
            });

            transaction.__span = agent.startSpan('wait');

            msg.__transaction = transaction;
          }
        }

        return original.call(this, msg);
      };
    });

    shimmer.wrap(sessionProto.protocol_handlers, 'method', function(original) {
      return function(msg, unblock) {
        if (msg.__transaction) {
          if (msg.__transaction.__span) {
            msg.__transaction.__span.end();
            msg.__transaction.__span = undefined;
          }

          msg.__transaction.__span = agent.startSpan('execution');
        }

        return original.call(this, msg, unblock);
      };
    });

    shimmer.wrap(sessionProto.protocol_handlers, 'sub', function(original) {
      return function(msg, unblock) {
        const self = this;
        if (msg.__transaction) {
          if (msg.__transaction.__span) {
            msg.__transaction.__span.end();
          }

          msg.__transaction.__span = agent.startSpan('execution');
        }

        const result = original.call(self, msg, unblock);

        return result;
      };
    });

    shimmer.wrap(sessionProto.protocol_handlers, 'unsub', function(original) {
      return function(msg, unblock) {
        if (msg.__transaction) {
          if (msg.__transaction.__span) {
            msg.__transaction.__span.end();
          }

          msg.__transaction.__span = agent.startSpan('execution');
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
