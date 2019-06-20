/* eslint-disable prefer-spread */
/* eslint-disable prefer-rest-params */
/* eslint-disable no-undef */
// This hijack is important to make sure, collections created before
// we hijack dbOps, even gets tracked.
//  Meteor does not simply expose MongoConnection object to the client
//  It picks methods which are necessory and make a binded object and
//  assigned to the Mongo.Collection
//  so, even we updated prototype, we can't track those collections
//  but, this will fix it.
module.exports = function hack() {
  const originalOpen = MongoInternals.RemoteCollectionDriver.prototype.open;
  MongoInternals.RemoteCollectionDriver.prototype.open = function open(name) {
    const self = this;
    const ret = originalOpen.call(self, name);

    Object.keys(ret).forEach(ret, function(fn, m) {
      // make sure, it's in the actual mongo connection object
      // meteorhacks:mongo-collection-utils package add some arbitary methods
      // which does not exist in the mongo connection
      if (self.mongo[m]) {
        ret[m] = function() {
          Array.prototype.unshift.call(arguments, name);

          return self.mongo[m].apply(self.mongo, arguments);
        };
      }
    });

    return ret;
  };
};
