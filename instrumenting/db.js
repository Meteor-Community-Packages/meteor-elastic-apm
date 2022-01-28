import shimmer from 'shimmer';
import { DB } from '../constants';

function start(agent, Meteor, MongoCursor) {
  const meteorCollectionProto = Meteor.Collection.prototype;
  ['findOne', 'find', 'update', 'remove', 'insert', 'createIndex', '_dropIndex'].forEach(function (
    func
  ) {
    shimmer.wrap(meteorCollectionProto, func, function (original) {
      return function (...args) {
        const collName = this._name;
        const dbExecSpan = agent.startSpan(`${collName}.${func}`, DB);

        function closeSpan(exception, result) {
          if (!dbExecSpan) {
            return;
          }

          if (exception) {
            dbExecSpan.addLabels({
              status: 'fail',
              exception,
            });

            agent.captureError(exception);
          }

          if (func === 'insert') {
            const [document] = args;

            dbExecSpan.addLabels({
              document: JSON.stringify(document),
              docInserted: result,
            });
          } else if (func === 'find' || func === 'findOne') {
            const [selector = {}, options = {}] = args;

            let docsFetched = Array.isArray(result) ? result.length : 0;

            if (func === 'findOne') {
              docsFetched = result ? 1 : 0;
            }

            dbExecSpan.addLabels({
              selector: JSON.stringify(selector),
              options: JSON.stringify(options),
              docsFetched,
            });
          } else if (func === 'update') {
            const [selector = {}, modifier = {}, options = {}] = args;

            dbExecSpan.addLabels({
              selector: JSON.stringify(selector),
              options: JSON.stringify(options),
              modifier: JSON.stringify(modifier),
              docsUpdated: result,
            });
          } else if (func === 'remove') {
            const [selector = {}] = args;

            dbExecSpan.addLabels({
              selector: JSON.stringify(selector),
              docsRemoved: result,
            });
          }

          dbExecSpan.end();
        }

        try {
          if (typeof args[args.length - 1] === 'function') {
            const newArgs = args.slice(0, args.length - 1);
            const callback = args[args.length - 1];

            if (dbExecSpan) {
              dbExecSpan.addLabels({
                async: true,
              });
            }

            const newCallback = (exception, result) => {
              closeSpan(exception, result);

              callback(exception, result);
            };

            return original.apply(this, [...newArgs, newCallback]);
          }
          const ret = original.apply(this, args);

          closeSpan(null, ret);
          return ret;
        } catch (ex) {
          closeSpan(ex);

          throw ex;
        }
      };
    });
  });

  const cursorProto = MongoCursor.prototype;
  ['forEach', 'map', 'fetch', 'count', 'observeChanges', 'observe', 'rewind'].forEach(function (
    type
  ) {
    shimmer.wrap(cursorProto, type, function (original) {
      return function (...args) {
        const cursorDescription = this._cursorDescription;

        const transaction = agent.currentTransaction;
        if (transaction) {
          if (transaction.__span) {
            transaction.__span.end();
          }
          transaction.__span = agent.startSpan(`${cursorDescription.collectionName}:${type}`, DB);
        }

        function closeSpan(ex, result) {
          if (transaction) {
            const cursorSpan = transaction.__span;
            if (cursorSpan) {
              if (ex) {
                transaction.__span.addLabels({
                  status: 'fail',
                  exception: ex,
                });
              }

              if (type === 'fetch' || type === 'map') {
                const docsFetched = result ? result.length : 0;

                cursorSpan.addLabels({
                  docsFetched,
                });
              }

              cursorSpan.addLabels({
                selector: JSON.stringify(cursorDescription.selector),
              });

              if (cursorDescription.options) {
                const { fields, sort, limit } = cursorDescription.options;

                cursorSpan.addLabels({
                  fields: JSON.stringify(fields || {}),
                  sort: JSON.stringify(sort || {}),
                  limit,
                });
              }

              cursorSpan.end();
              transaction.__span = undefined;
            }
          }
          if (ex) {
            agent.captureError(ex);
          }
        }

        try {
          const result = original.apply(this, args);

          closeSpan(null, result);
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
