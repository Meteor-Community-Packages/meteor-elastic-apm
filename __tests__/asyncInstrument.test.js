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
  expect(Fibers.current._apmSpan).toBeDefined();

  Fibers.current.run();

  expect(Fibers.current._apmSpan).toBeNull();

  expect(agent.startSpan.mock.calls.length).toBe(1);
});

test('do not create span if transaction is empty', () => {
  const Fibers = newFibers();
  const agent = newAgent();

  instrumentAsync(agent, Fibers);

  Fibers.yield();
  Fibers.current.run();

  expect(agent.startSpan.mock.calls.length).toBe(0);
});
