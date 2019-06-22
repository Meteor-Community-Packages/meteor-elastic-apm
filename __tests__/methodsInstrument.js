const instrumentMethods = require('./../instrumenting/methods');
const newAgent = require('./mocks/agent');
const newMeteor = require('./mocks/meteor');

test('catch meteor method exception', () => {
  const Meteor = newMeteor();

  Meteor.methods({
    method1() {
      throw new Error('Test error 1');
    }
  });

  const agent = newAgent();
  agent.currentTransaction = {
    name: 'test'
  };

  instrumentMethods(agent, Meteor);

  Meteor.methods({
    method2() {
      throw new Error('Test error 2');
    }
  });

  expect(() => {
    Meteor.default_server.method_handlers.method1();
  }).toThrow();

  expect(agent.captureError.mock.calls.length).toBe(1);
  expect(agent.captureError.mock.calls[0][0].message).toBe('Test error 1');

  expect(() => {
    Meteor.default_server.method_handlers.method2();
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
  agent.currentTransaction = {
    name: 'test'
  };

  instrumentMethods(agent, Meteor);

  expect(() => {
    Meteor.default_server.method_handlers.textError();
  }).toThrow();

  expect(agent.captureError.mock.calls.length).toBe(1);
  expect(agent.captureError.mock.calls[0][0].message).toBe('Test error 1');
});
