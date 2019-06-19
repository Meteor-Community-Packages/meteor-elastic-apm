function newMongoCursor() {
  function MongoCursor() {}

  MongoCursor.prototype._name = 'test collection';
  MongoCursor.prototype.forEach = jest.fn();
  MongoCursor.prototype.map = jest.fn();
  MongoCursor.prototype.fetch = jest.fn();
  MongoCursor.prototype.count = jest.fn();
  MongoCursor.prototype.observeChanges = jest.fn();
  MongoCursor.prototype.observe = jest.fn();
  MongoCursor.prototype.rewind = jest.fn();

  return MongoCursor;
}

module.exports = newMongoCursor;
