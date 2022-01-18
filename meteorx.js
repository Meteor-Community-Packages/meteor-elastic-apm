/* eslint-disable no-undef */
// Various tricks for accessing "private" Meteor APIs borrowed from the
// now-unmaintained meteorhacks:meteorx package.

export const Server = Meteor.server.constructor;

function getSession() {
  const fakeSocket = {
    send() {},
    close() {},
    headers: []
  };

  const server = Meteor.server;

  server._handleConnect(fakeSocket, {
    msg: 'connect',
    version: 'pre1',
    support: ['pre1']
  });

  const session = fakeSocket._meteorSession;

  server._removeSession(session);

  return session;
}

const session = getSession();
export const Session = session.constructor;

const collection = new Mongo.Collection(`__dummy_coll_${Random.id()}`);
collection.findOne();
const cursor = collection.find();
export const MongoCursor = cursor.constructor;

function getMultiplexer(multiCursor) {
  const handle = multiCursor.observeChanges({
    added() {}
  });
  handle.stop();
  return handle._multiplexer;
}

export const Multiplexer = getMultiplexer(cursor).constructor;

export const MongoConnection = MongoInternals.defaultRemoteCollectionDriver().mongo.constructor;

function getSubscription(subSession) {
  const subId = Random.id();

  subSession._startSubscription(
    function() {
      this.ready();
    },
    subId,
    [],
    `__dummy_pub_${Random.id()}`
  );

  const subscription =
    subSession._namedSubs instanceof Map
      ? subSession._namedSubs.get(subId)
      : subSession._namedSubs[subId];

  subSession._stopSubscription(subId);

  return subscription;
}

export const Subscription = getSubscription(session).constructor;

function getObserverDriver(obsCursor) {
  const multiplexer = getMultiplexer(obsCursor);
  return (multiplexer && multiplexer._observeDriver) || null;
}

function getMongoOplogDriver() {
  const driver = getObserverDriver(cursor);
  const MongoOplogDriver = (driver && driver.constructor) || null;
  if (MongoOplogDriver && typeof MongoOplogDriver.cursorSupported !== 'function') {
    return null;
  }
  return MongoOplogDriver;
}

export const MongoOplogDriver = getMongoOplogDriver();

function getMongoPollingDriver() {
  const driverCursor = collection.find(
    {},
    {
      limit: 20,
      _disableOplog: true
    }
  );

  const driver = getObserverDriver(driverCursor);

  // verify observer driver is a polling driver
  if (driver && typeof driver.constructor.cursorSupported === 'undefined') {
    return driver.constructor;
  }

  return null;
}

export const MongoPollingDriver = getMongoPollingDriver();
