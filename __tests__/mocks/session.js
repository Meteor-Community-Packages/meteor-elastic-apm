function newSession() {
  function Session() {}

  Session.prototype.processMessage = jest.fn();
  Session.prototype.protocol_handlers = {
    method: jest.fn(),
    sub: jest.fn(),
    unsub: jest.fn()
  };

  return Session;
}

module.exports = newSession;
