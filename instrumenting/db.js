import shimmer from 'shimmer';
import { DB } from '../constants';

function start(agent, Meteor, MongoCursor) {
  const mongoConnectionProto = Meteor.Collection.prototype;
  // findOne is handled by find - so no need to track it
  // upsert is handled by update
  ['find', 'update', 'remove', 'insert', '_ensureIndex', '_dropIndex'].forEach(function(func) {
    shimmer.wrap(mongoConnectionProto, func, function(original) {
      return function(...args) {
        const transaction = agent.currentTransaction;

        const collName = this._name;
        if (transaction) {
          const dbExecSpan = agent.startSpan(`${collName}.${func}`, DB);
          transaction.__span = dbExecSpan;
        }

        try {
          const ret = original.apply(this, args);

          if (transaction && transaction.__span) {
            transaction.__span.end();
            transaction.__span = null;
          }

          return ret;
        } catch (ex) {
          if (transaction && transaction.__span) {
            transaction.__span.end();
            transaction.__span = null;
          }
          throw ex;
        }
      };
    });
  });

  const cursorProto = MongoCursor.prototype;
  ['forEach', 'map', 'fetch', 'count', 'observeChanges', 'observe', 'rewind'].forEach(function(
    type
  ) {
    shimmer.wrap(cursorProto, type, function(original) {
      return function(...args) {
        const cursorDescription = this._cursorDescription;

        const transaction = agent.currentTransaction;
        if (transaction) {
          if (transaction.__span) {
            transaction.__span.end();
          }
          transaction.__span = agent.startSpan(`${cursorDescription.collectionName}:${type}`, DB);
        }

        function closeSpan(ex) {
          if (transaction) {
            if (transaction.__span) {
              transaction.__span.end();
              transaction.__span = undefined;
            }
          }
          if (ex) {
            agent.captureError(ex);
          }
        }

        try {
          const result = original.apply(this, args);

          closeSpan();
          return result;
        } catch (ex) {
          closeSpan(ex);
          throw ex;
        }
      };
    });
  });
}

module.exports = start;
