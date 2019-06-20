const instrumentDB = require('./../instrumenting/db');
const newAgent = require('./mocks/agent');
const newMeteor = require('./mocks/meteor');
const newMongoCursor = require('./mocks/mongoCursor');

test('track meteor collection methods', () => {
  const agent = newAgent();
  const Meteor = newMeteor();
  const MongoCursor = newMongoCursor();

  instrumentDB(agent, Meteor, MongoCursor);

  agent.currentTransaction = agent.startTransaction();

  const testCollection = new Meteor.Collection();
  testCollection._name = 'testCollection';

  testCollection.find({ _id: 1 });

  expect(agent.startSpan.mock.calls.length).toBe(1);
  expect(agent.startSpan.mock.calls[0][0]).toBe(`${testCollection._name}.find`);
  expect(agent.startSpan.mock.calls[0][1]).toBe('db');
});

test('ignore tracking meteor collection methods if no transaction', () => {
  const agent = newAgent();
  const Meteor = newMeteor();
  const MongoCursor = newMongoCursor();

  instrumentDB(agent, Meteor, MongoCursor);

  const testCollection = new Meteor.Collection();
  testCollection._name = 'testCollection';

  testCollection.find({ _id: 1 });

  expect(agent.startSpan.mock.calls.length).toBe(0);
});

test('ignore track mongo cursor methods if no transaction', () => {
  const agent = newAgent();
  const Meteor = newMeteor();
  const MongoCursor = newMongoCursor();

  instrumentDB(agent, Meteor, MongoCursor);

  const cursor = new MongoCursor();

  cursor.count();

  expect(agent.startSpan.mock.calls.length).toBe(0);
});

test('track mongo cursor methods', () => {
  const agent = newAgent();
  const Meteor = newMeteor();
  const MongoCursor = newMongoCursor();

  instrumentDB(agent, Meteor, MongoCursor);

  agent.currentTransaction = agent.startTransaction();

  const cursor = new MongoCursor();

  cursor._cursorDescription = {
    collectionName: 'test'
  };

  cursor.count();

  expect(agent.startSpan.mock.calls.length).toBe(1);
  expect(agent.startSpan.mock.calls[0][0]).toBe('test:count');
  expect(agent.startSpan.mock.calls[0][1]).toBe('db');
});
