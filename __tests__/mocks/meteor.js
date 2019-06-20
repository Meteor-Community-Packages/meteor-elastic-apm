function Collection() {}

Collection.prototype.find = jest.fn();
Collection.prototype.update = jest.fn();
Collection.prototype.remove = jest.fn();
Collection.prototype.insert = jest.fn();
Collection.prototype._ensureIndex = jest.fn();
Collection.prototype._dropIndex = jest.fn();

function newMeteor() {
  return {
    call: jest.fn(),
    subscribe: jest.fn(),
    publish: jest.fn(),
    Collection,
    methods(methodsMap) {
      this.default_server.method_handlers = {
        ...this.default_server.method_handlers,
        ...methodsMap
      };
    },
    default_server: {
      method_handlers: {}
    }
  };
}

module.exports = newMeteor;
