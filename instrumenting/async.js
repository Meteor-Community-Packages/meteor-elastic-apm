import shimmer from 'shimmer';
import { ASYNC, DB } from '../constants';

const EventSymbol = Symbol('ASYNC');

function start(agent, Fibers) {
  shimmer.wrap(Fibers, 'yield', function(original) {
    return function(...args) {
      const parentSpan = agent.currentSpan || {};

      const validParents = parentSpan.type !== ASYNC && parentSpan.type !== DB;

      if (validParents) {
        Fibers.current[EventSymbol] = agent.startSpan(ASYNC, ASYNC);
      }

      return original.apply(this, args);
    };
  });

  shimmer.wrap(Fibers.prototype, 'run', function(original) {
    return function(...args) {
      if (this[EventSymbol]) {
        this[EventSymbol].end();
        this[EventSymbol] = undefined;
      }
      return original.apply(this, args);
    };
  });
}

module.exports = start;
module.exports.EventSymbol = EventSymbol;
