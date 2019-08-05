const instrumentDB = require('./../instrumenting/db');
const newAgent = require('./mocks/agent');
const newMeteor = require('./mocks/meteor');
const newMongoCursor = require('./mocks/mongoCursor');

test('track meteor collection methods (fibers)', () => {
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

test('track meteor collection methods (callback)', () => {
  const agent = newAgent();
  const Meteor = newMeteor();
  const MongoCursor = newMongoCursor();

  Meteor.Collection.prototype.insert = function(data, callback) {
    setTimeout(() => callback(), 100);
  };

  instrumentDB(agent, Meteor, MongoCursor);

  agent.currentTransaction = agent.startTransaction();

  const testCollection = new Meteor.Collection();
  testCollection._name = 'testCollection';

  return new Promise((res, rej) => {
    testCollection.insert({ _id: 1 }, function(err) {
      if (err) {
        rej(err);
      } else {
        res(
          Promise.resolve().then(() => {
            expect(agent.startSpan.mock.calls.length).toBe(1);
            expect(agent.startSpan.mock.calls[0][0]).toBe(`${testCollection._name}.insert`);
            expect(agent.startSpan.mock.calls[0][1]).toBe('db');
          })
        );
      }
    });
  });
});

test('catch collection exceptions', () => {
  const agent = newAgent();
  const Meteor = newMeteor();
  const MongoCursor = newMongoCursor();

  Meteor.Collection.prototype.find = () => {
    throw new Error();
  };

  instrumentDB(agent, Meteor, MongoCursor);

  const testCollection = new Meteor.Collection();

  agent.currentTransaction = agent.startTransaction();
  testCollection._name = 'testCollection';

  expect(() => {
    testCollection.find({ _id: 1 });
  }).toThrow();

  expect(agent.startSpan.mock.calls.length).toBe(1);
  expect(agent.startSpan.mock.calls[0][0]).toBe(`${testCollection._name}.find`);
  expect(agent.startSpan.mock.calls[0][1]).toBe('db');
  expect(agent.captureError.mock.calls.length).toBe(1);

  Meteor.Collection.prototype.find = jest.fn();
});

test('track collection insert', () => {
  const agent = newAgent();
  const Meteor = newMeteor();
  const MongoCursor = newMongoCursor();

  instrumentDB(agent, Meteor, MongoCursor);

  agent.currentTransaction = agent.startTransaction();

  const testCollection = new Meteor.Collection();
  testCollection._name = 'testCollection';

  testCollection.insert({ _id: 1 });

  expect(agent.startSpan.mock.calls.length).toBe(1);
  expect(agent.startSpan.mock.calls[0][0]).toBe(`${testCollection._name}.insert`);
  expect(agent.startSpan.mock.calls[0][1]).toBe('db');
});

test('track collection update', () => {
  const agent = newAgent();
  const Meteor = newMeteor();
  const MongoCursor = newMongoCursor();

  instrumentDB(agent, Meteor, MongoCursor);

  agent.currentTransaction = agent.startTransaction();

  const testCollection = new Meteor.Collection();
  testCollection._name = 'testCollection';

  testCollection.update({ _id: 1 }, { $set: { prop: 1 } });

  expect(agent.startSpan.mock.calls.length).toBe(1);
  expect(agent.startSpan.mock.calls[0][0]).toBe(`${testCollection._name}.update`);
  expect(agent.startSpan.mock.calls[0][1]).toBe('db');
});

test('track collection remove', () => {
  const agent = newAgent();
  const Meteor = newMeteor();
  const MongoCursor = newMongoCursor();

  instrumentDB(agent, Meteor, MongoCursor);

  agent.currentTransaction = agent.startTransaction();

  const testCollection = new Meteor.Collection();
  testCollection._name = 'testCollection';

  testCollection.remove({ _id: 1 });

  expect(agent.startSpan.mock.calls.length).toBe(1);
  expect(agent.startSpan.mock.calls[0][0]).toBe(`${testCollection._name}.remove`);
  expect(agent.startSpan.mock.calls[0][1]).toBe('db');
});

test('track collection findOne', () => {
  const agent = newAgent();
  const Meteor = newMeteor();
  const MongoCursor = newMongoCursor();

  instrumentDB(agent, Meteor, MongoCursor);

  agent.currentTransaction = agent.startTransaction();

  const testCollection = new Meteor.Collection();
  testCollection._name = 'testCollection';

  testCollection.findOne({ _id: 1 });

  expect(agent.startSpan.mock.calls.length).toBe(1);
  expect(agent.startSpan.mock.calls[0][0]).toBe(`${testCollection._name}.findOne`);
  expect(agent.startSpan.mock.calls[0][1]).toBe('db');
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

test('close transaction and its span on cursor methods', () => {
  const agent = newAgent();
  const Meteor = newMeteor();
  const MongoCursor = newMongoCursor();

  instrumentDB(agent, Meteor, MongoCursor);

  agent.currentTransaction = agent.startTransaction();
  const span = agent.startSpan();
  agent.currentTransaction.__span = span;

  const cursor = new MongoCursor();

  cursor._cursorDescription = {
    collectionName: 'test'
  };

  cursor.count();

  expect(agent.startSpan.mock.calls.length).toBe(2);
  expect(agent.startSpan.mock.calls[1][0]).toBe('test:count');
  expect(agent.startSpan.mock.calls[1][1]).toBe('db');
  expect(span.end.mock.calls.length).toBe(1);
});

test('track db cursor fetch and map methods', () => {
  const agent = newAgent();
  const Meteor = newMeteor();
  const MongoCursor = newMongoCursor();

  instrumentDB(agent, Meteor, MongoCursor);

  agent.currentTransaction = agent.startTransaction();
  const span = agent.startSpan();
  agent.currentTransaction.__span = span;

  const cursor = new MongoCursor();

  cursor._cursorDescription = {
    collectionName: 'test'
  };

  cursor.fetch();

  expect(agent.startSpan.mock.calls.length).toBe(2);
  expect(agent.startSpan.mock.calls[1][0]).toBe('test:fetch');
  expect(agent.startSpan.mock.calls[1][1]).toBe('db');
  expect(span.end.mock.calls.length).toBe(1);
});

test('track db cursor options', () => {
  const agent = newAgent();
  const Meteor = newMeteor();
  const MongoCursor = newMongoCursor();

  instrumentDB(agent, Meteor, MongoCursor);

  agent.currentTransaction = agent.startTransaction();
  const span = agent.startSpan();
  agent.currentTransaction.__span = span;

  const cursor = new MongoCursor();

  cursor._cursorDescription = {
    collectionName: 'test',
    options: {
      fields: { field1: 1 },
      sort: { field1: 1 },
      limit: 1
    }
  };

  cursor.fetch();

  expect(agent.startSpan.mock.calls.length).toBe(2);
  expect(agent.startSpan.mock.calls[1][0]).toBe('test:fetch');
  expect(agent.startSpan.mock.calls[1][1]).toBe('db');
  expect(span.end.mock.calls.length).toBe(1);
});

test('ignore cursor method if transaction is undefined', () => {
  const agent = newAgent();
  const Meteor = newMeteor();
  const MongoCursor = newMongoCursor();

  instrumentDB(agent, Meteor, MongoCursor);

  const cursor = new MongoCursor();

  cursor.fetch();

  expect(agent.startSpan.mock.calls.length).toBe(0);
});

test('catch cursor exceptions', () => {
  const agent = newAgent();
  const Meteor = newMeteor();
  const MongoCursor = newMongoCursor();

  MongoCursor.prototype.fetch = () => {
    throw new Error();
  };

  instrumentDB(agent, Meteor, MongoCursor);

  agent.currentTransaction = agent.startTransaction();
  const span = agent.startSpan();
  agent.currentTransaction.__span = span;

  const cursor = new MongoCursor();

  cursor._cursorDescription = {
    collectionName: 'test',
    options: {
      fields: { field1: 1 },
      sort: { field1: 1 },
      limit: 1
    }
  };

  expect(() => {
    cursor.fetch();
  }).toThrow();

  expect(agent.startSpan.mock.calls.length).toBe(2);
  expect(agent.startSpan.mock.calls[1][0]).toBe('test:fetch');
  expect(agent.startSpan.mock.calls[1][1]).toBe('db');
  expect(span.end.mock.calls.length).toBe(1);
  expect(agent.captureError.mock.calls.length).toBe(1);

  MongoCursor.prototype.fetch = jest.fn();
});
