import shimmer from 'shimmer';
import { ASYNC } from '../constants';

function start(agent, Fibers) {
  shimmer.wrap(Fibers, 'yield', function(original) {
    return function(...args) {
      const transaction = agent.currentTransaction;
      if (transaction) {
        const span = agent.startSpan(ASYNC, ASYNC);
        if (span) {
          Fibers.current._apmSpan = span;
        }
      }

      return original.apply(this, args);
    };
  });

  shimmer.wrap(Fibers.prototype, 'run', function(original) {
    return function(...args) {
      if (this._apmSpan) {
        this._apmSpan.end();
        this._apmSpan = null;
      }
      return original.apply(this, args);
    };
  });
}

module.exports = start;
