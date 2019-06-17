import shimmer from 'shimmer';
import { ASYNC } from '../constants';

function start(agent, Fibers) {
  shimmer.wrap(Fibers, 'yield', function(original) {
    return function(...args) {
      const transaction = agent.currentTransaction;
      if (transaction) {
        const span = agent.startSpan();
        if (span) {
          span.name = ASYNC.NAME;
          span.type = ASYNC.TYPE;
          Fibers.current._apmSpan = span;
        }
      }

      return original.apply(this, args);
    };
  });

  shimmer.wrap(Fibers, 'run', function(original) {
    return function(...args) {
      if (this._apmSpan) {
        this._apmSpan.end();
        this._apmSpan = null;
      }
      return original.call(this, args);
    };
  });
}

module.exports = start;
