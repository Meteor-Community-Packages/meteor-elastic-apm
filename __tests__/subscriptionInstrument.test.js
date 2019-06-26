const instrumentSubscription = require('./../instrumenting/subscription');
const newAgent = require('./mocks/agent');
const newSubscription = require('./mocks/subscription');

test('track when subscription is run', () => {
  const Subscription = newSubscription();
  const agent = newAgent();

  agent.currentTransaction = {
    name: 'test'
  };

  instrumentSubscription(agent, Subscription);
  const sub = new Subscription();

  sub._runHandler();

  expect(sub.__transaction).toBe(agent.currentTransaction);
});

test('ignore track if current transaction is undefined', () => {
  const Subscription = newSubscription();
  const agent = newAgent();

  instrumentSubscription(agent, Subscription);

  const sub = new Subscription();

  sub._runHandler();

  expect(sub.__transaction).toBeUndefined();
});

test('close transaction when sub is ready', () => {
  const Subscription = newSubscription();
  const agent = newAgent();

  const transaction = agent.startTransaction();

  agent.currentTransaction = transaction;

  instrumentSubscription(agent, Subscription);
  const sub = new Subscription();

  sub._runHandler();

  sub.ready();

  expect(sub.__transaction).toBeUndefined();
  expect(transaction.end.mock.calls.length).toBe(1);
});

test('close transaction and its span when sub is ready', () => {
  const Subscription = newSubscription();
  const agent = newAgent();

  const transaction = agent.startTransaction();
  const waitSpan = agent.startSpan();

  transaction.__span = waitSpan;
  agent.currentTransaction = transaction;

  instrumentSubscription(agent, Subscription);
  const sub = new Subscription();

  sub._runHandler();

  sub.ready();

  expect(sub.__transaction).toBeUndefined();
  expect(transaction.end.mock.calls.length).toBe(1);
  expect(waitSpan.end.mock.calls.length).toBe(1);
});

test('ignore track if transaction is undefined when sub is ready', () => {
  const Subscription = newSubscription();
  const agent = newAgent();

  instrumentSubscription(agent, Subscription);
  const sub = new Subscription();

  sub._runHandler();

  sub.ready();

  expect(sub.__transaction).toBeUndefined();
});

test('close transaction and capture error if sub throws error', () => {
  const Subscription = newSubscription();
  const agent = newAgent();

  const transaction = agent.startTransaction();

  agent.currentTransaction = transaction;

  instrumentSubscription(agent, Subscription);
  const sub = new Subscription();

  sub._runHandler();

  sub.error(new Error('test error'));

  expect(sub.__transaction).toBeUndefined();
  expect(transaction.end.mock.calls.length).toBe(1);
  expect(agent.captureError.mock.calls.length).toBe(1);
});

test('close transaction/span and capture error if sub throws error', () => {
  const Subscription = newSubscription();
  const agent = newAgent();

  const transaction = agent.startTransaction();
  const waitSpan = agent.startSpan();

  transaction.__span = waitSpan;
  agent.currentTransaction = transaction;

  instrumentSubscription(agent, Subscription);
  const sub = new Subscription();

  sub._runHandler();

  sub.error(new Error('test error'));

  expect(sub.__transaction).toBeUndefined();
  expect(transaction.end.mock.calls.length).toBe(1);
  expect(waitSpan.end.mock.calls.length).toBe(1);
  expect(agent.captureError.mock.calls.length).toBe(1);
});

test('ignore track if transaction is undefined on sub error', () => {
  const Subscription = newSubscription();
  const agent = newAgent();

  instrumentSubscription(agent, Subscription);
  const sub = new Subscription();

  sub._runHandler();

  sub.error();

  expect(sub.__transaction).toBeUndefined();
});
