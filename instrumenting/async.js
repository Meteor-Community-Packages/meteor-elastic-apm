import shimmer from 'shimmer';
import { ASYNC } from '../constants';

const EventSymbol = Symbol();

function start(agent, Fibers) {
  shimmer.wrap(Fibers, 'yield', function(original) {
    return function(...args) {
      const transaction = agent.currentTransaction;
      if (transaction) {
        const span = agent.startSpan(ASYNC, ASYNC);
        if (span) {
          Fibers.current[EventSymbol] = span;
        }
      }

      return original.apply(this, args);
    };
  });

  shimmer.wrap(Fibers.prototype, 'run', function(original) {
    return function(...args) {
      if (this[EventSymbol]) {
        this[EventSymbol].end();
        this[EventSymbol] = null;
      }
      return original.apply(this, args);
    };
  });
}

module.exports = start;
module.exports.EventSymbol = EventSymbol;
