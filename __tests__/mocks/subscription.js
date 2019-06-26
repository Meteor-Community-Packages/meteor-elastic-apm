function newSubscription() {
  function Subscription() {}

  Subscription.prototype._runHandler = jest.fn();
  Subscription.prototype.ready = jest.fn();
  Subscription.prototype.error = jest.fn();

  Subscription.prototype.added = jest.fn();
  Subscription.prototype.changed = jest.fn();
  Subscription.prototype.removed = jest.fn();
  Subscription.prototype._documents = {
    testCollection: {}
  };

  return Subscription;
}

module.exports = newSubscription;
