const newFibers = require('./mocks/fibers');
const instrumentAsync = require('./../instrumenting/async');
const newAgent = require('./mocks/agent');

test('track async execution', () => {
  const Fibers = newFibers();
  const agent = newAgent();

  agent.currentTransaction = {
    name: 'test'
  };
  instrumentAsync(agent, Fibers);
  Fibers.yield();

  expect(Fibers.current[instrumentAsync.EventSymbol]).toBeDefined();

  Fibers.current.run();

  expect(Fibers.current[instrumentAsync.EventSymbol]).toBeUndefined();

  expect(agent.startSpan.mock.calls.length).toBe(1);
});
