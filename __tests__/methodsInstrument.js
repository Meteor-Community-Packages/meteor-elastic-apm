const instrumentMethods = require('../instrumenting/methods');
const newAgent = require('./mocks/agent');
const newMeteor = require('./mocks/meteor');

test('close transaction with method result', () => {
  const Meteor = newMeteor();

  Meteor.methods({
    method1() {
      return 'test result';
    }
  });

  const agent = newAgent();

  const transaction = agent.startTransaction();
  const span = agent.startSpan();

  agent.currentTransaction = transaction;
  agent.currentTransaction.__span = span;

  instrumentMethods(agent, Meteor);

  Meteor.methods({
    method2() {
      return 'test result 2';
    }
  });

  Meteor.server.method_handlers.method1();

  expect(agent.currentTransaction.end.mock.calls.length).toBe(1);
  expect(agent.currentTransaction.end.mock.calls[0][0]).toBe('success');

  Meteor.server.method_handlers.method2();

  expect(agent.currentTransaction.end.mock.calls.length).toBe(2);
  expect(agent.currentTransaction.end.mock.calls[1][0]).toBe('success');
});

test('ignore if transaction is undefined', () => {
  const Meteor = newMeteor();

  Meteor.methods({
    method1() {
      return 'test result';
    }
  });

  const agent = newAgent();

  instrumentMethods(agent, Meteor);

  Meteor.server.method_handlers.method1();
});

test('close transaction and its span with method result', () => {
  const Meteor = newMeteor();

  Meteor.methods({
    method1() {
      return 'test result';
    }
  });

  const agent = newAgent();

  const transaction = agent.startTransaction();
  const span = agent.startSpan();

  agent.currentTransaction = transaction;
  agent.currentTransaction.__span = span;

  instrumentMethods(agent, Meteor);

  Meteor.methods({
    method2() {
      return 'test result 2';
    }
  });

  Meteor.server.method_handlers.method1();

  expect(agent.currentTransaction.end.mock.calls.length).toBe(1);
  expect(agent.currentTransaction.end.mock.calls[0][0]).toBe('success');
  expect(agent.currentTransaction.__span).toBeUndefined();
  expect(span.end.mock.calls.length).toBe(1);
});

test('catch meteor method exception', () => {
  const Meteor = newMeteor();

  Meteor.methods({
    method1() {
      throw new Error('Test error 1');
    }
  });

  const agent = newAgent();

  const transaction = agent.startTransaction();
  const span = agent.startSpan();

  agent.currentTransaction = transaction;
  agent.currentTransaction.__span = span;

  instrumentMethods(agent, Meteor);

  Meteor.methods({
    method2() {
      throw new Error('Test error 2');
    }
  });

  expect(() => {
    Meteor.server.method_handlers.method1();
  }).toThrow();

  expect(agent.captureError.mock.calls.length).toBe(1);
  expect(agent.captureError.mock.calls[0][0].message).toBe('Test error 1');

  expect(() => {
    Meteor.server.method_handlers.method2();
  }).toThrow();

  expect(agent.captureError.mock.calls.length).toBe(2);
  expect(agent.captureError.mock.calls[1][0].message).toBe('Test error 2');
});

test('transform string exception into Error object', () => {
  const Meteor = newMeteor();

  Meteor.methods({
    textError() {
      // eslint-disable-next-line no-throw-literal
      throw 'Test error 1';
    }
  });

  const agent = newAgent();

  const transaction = agent.startTransaction();
  const span = agent.startSpan();

  agent.currentTransaction = transaction;
  agent.currentTransaction.__span = span;

  instrumentMethods(agent, Meteor);

  expect(() => {
    Meteor.server.method_handlers.textError();
  }).toThrow();

  expect(agent.captureError.mock.calls.length).toBe(1);
  expect(agent.captureError.mock.calls[0][0].message).toBe('Test error 1');
});
