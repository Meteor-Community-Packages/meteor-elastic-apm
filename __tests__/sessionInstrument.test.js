const instrumentSession = require('./../instrumenting/session');
const newAgent = require('./mocks/agent');
const newSession = require('./mocks/session');

test('track session method messages', function() {
  const Session = newSession();

  const agent = newAgent();
  agent.currentTransaction = {
    name: 'test'
  };

  instrumentSession(agent, Session);

  const clientSession = new Session();

  const msg = {
    msg: 'method',
    method: 'methodCall'
  };

  clientSession.processMessage(msg);

  expect(agent.startTransaction.mock.calls.length).toBe(1);
  expect(agent.startTransaction.mock.calls[0][0]).toBe('methodCall');
  expect(agent.startTransaction.mock.calls[0][1]).toBe('method');
});

test('track session sub messages', function() {
  const Session = newSession();

  const agent = newAgent();
  agent.currentTransaction = {
    name: 'test'
  };

  instrumentSession(agent, Session);

  const clientSession = new Session();

  const msg = {
    msg: 'sub',
    name: 'subName'
  };

  clientSession.processMessage(msg);

  expect(agent.startTransaction.mock.calls.length).toBe(1);
  expect(agent.startTransaction.mock.calls[0][0]).toBe('subName');
  expect(agent.startTransaction.mock.calls[0][1]).toBe('sub');
});

test('ignore session message is not method and sub', function() {
  const Session = newSession();

  const agent = newAgent();
  agent.currentTransaction = {
    name: 'test'
  };

  instrumentSession(agent, Session);

  const clientSession = new Session();

  const msg = {
    msg: 'ping'
  };

  clientSession.processMessage(msg);

  expect(agent.startTransaction.mock.calls.length).toBe(0);
});

test('session meteor method call', function() {
  const Session = newSession();

  const agent = newAgent();
  agent.currentTransaction = {
    name: 'test'
  };

  instrumentSession(agent, Session);

  const clientSession = new Session();

  const transaction = agent.startTransaction();
  const msg = {
    msg: 'sub',
    name: 'subName',
    __transaction: transaction
  };

  clientSession.protocol_handlers.method(msg);

  expect(agent.startSpan.mock.calls.length).toBe(1);
  expect(agent.startSpan.mock.calls[0][0]).toBe('execution');

  expect(transaction.end.mock.calls.length).toBe(1);
});

test('session meteor method call with waitSpan', function() {
  const Session = newSession();

  const agent = newAgent();
  agent.currentTransaction = {
    name: 'test'
  };

  instrumentSession(agent, Session);

  const clientSession = new Session();

  const transaction = agent.startTransaction();
  const waitSpan = agent.startSpan();

  const msg = {
    msg: 'sub',
    name: 'subName',
    __transaction: transaction
  };

  msg.__transaction.__span = waitSpan;

  clientSession.protocol_handlers.method(msg);

  expect(agent.startSpan.mock.calls.length).toBe(2);
  expect(agent.startSpan.mock.calls[1][0]).toBe('execution');

  expect(waitSpan.end.mock.calls.length).toBe(1);
  expect(transaction.end.mock.calls.length).toBe(1);
});

test('ignore meteor method call if transaction does not exist', function() {
  const Session = newSession();

  const agent = newAgent();

  instrumentSession(agent, Session);

  const clientSession = new Session();

  const msg = {
    msg: 'sub',
    name: 'subName'
  };

  clientSession.protocol_handlers.method(msg);

  expect(agent.startSpan.mock.calls.length).toBe(1);
});

test('session sub call', function() {
  const Session = newSession();

  const agent = newAgent();
  agent.currentTransaction = {
    name: 'test'
  };

  instrumentSession(agent, Session);

  const clientSession = new Session();

  const transaction = agent.startTransaction();
  const msg = {
    msg: 'sub',
    name: 'subName',
    __transaction: transaction
  };

  clientSession.protocol_handlers.sub(msg);

  expect(agent.startSpan.mock.calls.length).toBe(1);
  expect(agent.startSpan.mock.calls[0][0]).toBe('execution');
});

test('session sub call with waitSpan', function() {
  const Session = newSession();

  const agent = newAgent();
  agent.currentTransaction = {
    name: 'test'
  };

  instrumentSession(agent, Session);

  const clientSession = new Session();

  const transaction = agent.startTransaction();
  const waitSpan = agent.startSpan();
  const msg = {
    msg: 'sub',
    name: 'subName',
    __transaction: transaction
  };

  msg.__transaction.__span = waitSpan;

  clientSession.protocol_handlers.sub(msg);

  expect(agent.startSpan.mock.calls.length).toBe(2);
  expect(agent.startSpan.mock.calls[1][0]).toBe('execution');

  expect(waitSpan.end.mock.calls.length).toBe(1);
});

test('session sub call if transaction does not exist', function() {
  const Session = newSession();

  const agent = newAgent();

  instrumentSession(agent, Session);

  const clientSession = new Session();

  const msg = {
    msg: 'sub',
    name: 'subName'
  };

  clientSession.protocol_handlers.sub(msg);

  expect(agent.startSpan.mock.calls.length).toBe(0);
});

test('session unsub call', function() {
  const Session = newSession();

  const agent = newAgent();
  agent.currentTransaction = {
    name: 'test'
  };

  instrumentSession(agent, Session);

  const clientSession = new Session();

  const transaction = agent.startTransaction();
  const msg = {
    msg: 'sub',
    name: 'subName',
    __transaction: transaction
  };

  clientSession.protocol_handlers.unsub(msg);

  expect(agent.startSpan.mock.calls.length).toBe(1);
  expect(agent.startSpan.mock.calls[0][0]).toBe('execution');

  expect(msg.__transaction.end.mock.calls.length).toBe(1);
});

test('session unsub call with waitSpan', function() {
  const Session = newSession();

  const agent = newAgent();
  agent.currentTransaction = {
    name: 'test'
  };

  instrumentSession(agent, Session);

  const clientSession = new Session();

  const transaction = agent.startTransaction();
  const waitSpan = agent.startSpan();
  const msg = {
    msg: 'sub',
    name: 'subName',
    __transaction: transaction
  };

  msg.__transaction.__span = waitSpan;

  clientSession.protocol_handlers.unsub(msg);

  expect(agent.startSpan.mock.calls.length).toBe(2);
  expect(agent.startSpan.mock.calls[1][0]).toBe('execution');

  expect(waitSpan.end.mock.calls.length).toBe(1);
  expect(msg.__transaction.end.mock.calls.length).toBe(1);
});

test('ignore session unsub call if transaction does not exist', function() {
  const Session = newSession();

  const agent = newAgent();

  instrumentSession(agent, Session);

  const clientSession = new Session();

  const msg = {
    msg: 'sub',
    name: 'subName'
  };

  clientSession.protocol_handlers.unsub(msg);

  expect(agent.startSpan.mock.calls.length).toBe(0);
});
