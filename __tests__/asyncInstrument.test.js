const Fibers = require('./mocks/fibers');
const instrumentAsync = require('./../instrumenting/async');
const { newAgent } = require('./mocks/agent');

test('it should track async execution', function() {
  const agent = newAgent();
  agent.currentTransaction = {
    name: 'test'
  };
  instrumentAsync(agent, Fibers);
  Fibers.yield();
  expect(Fibers.current._apmSpan).toBeDefined();

  Fibers.run.call(Fibers.current);
  expect(Fibers.current._apmSpan).toBeNull();

  expect(agent.startSpan.mock.calls.length).toBe(1);
});

test('it should not create span if transaction is empty', function() {
  const agent = newAgent();
  instrumentAsync(agent, Fibers);

  Fibers.yield();
  Fibers.run();

  expect(agent.startSpan.mock.calls.length).toBe(0);
});
