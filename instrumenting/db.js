// import { MongoCursor } from '../meteorx';

// function start(apm) {
//   // This hijack is important to make sure, collections created before
//   // we hijack dbOps, even gets tracked.
//   //  Meteor does not simply expose MongoConnection object to the client
//   //  It picks methods which are necessary and make a binded object and
//   //  assigned to the Mongo.Collection
//   //  so, even we updated prototype, we can't track those collections
//   //  but, this will fix it.
//   var originalOpen = MongoInternals.RemoteCollectionDriver.prototype.open;
//   MongoInternals.RemoteCollectionDriver.prototype.open = function open(name) {
//     var self = this;
//     var ret = originalOpen.call(self, name);

//     Object.keys(ret).forEach(ret, function(fn, m) {
//       // make sure, it's in the actual mongo connection object
//       // meteorhacks:mongo-collection-utils package add some arbitary methods
//       // which does not exist in the mongo connection
//       if (self.mongo[m]) {
//         ret[m] = function() {
//           Array.prototype.unshift.call(arguments, name);

//           return self.mongo[m].apply(self.mongo, arguments);
//         };
//       }
//     });

//     return ret;
//   };

//   function hijackDBOps() {
//     const mongoConnectionProto = Meteor.Collection.prototype;
//     //findOne is handled by find - so no need to track it
//     //upsert is handles by update
//     ['find', 'update', 'remove', 'insert', '_ensureIndex', '_dropIndex'].forEach(function(func) {
//       const originalFunc = mongoConnectionProto[func];
//       mongoConnectionProto[func] = function() {
//         const transaction = apm.currentTransaction;

//         const collName = this._name;
//         if (transaction) {
//           const dbExecSpan = apm.startSpan(`${collName}.${func}`, 'db');
//           transaction.__span = dbExecSpan;
//         }

//         //this cause V8 to avoid any performance optimizations, but this is must to use
//         //otherwise, if the error adds try catch block our logs get messy and didn't work
//         //see: issue #6
//         try {
//           var ret = originalFunc.apply(this, arguments);

//           if (transaction && transaction.__span) {
//             transaction.__span.end();
//             transaction.__span = null;
//           }
//         } catch (ex) {
//           if (transaction && transaction.__span) {
//             transaction.__span.end();
//             transaction.__span = null;
//           }
//           throw ex;
//         }

//         return ret;
//       };
//     });

//     var cursorProto = MongoCursor.prototype;
//     ['forEach', 'map', 'fetch', 'count', 'observeChanges', 'observe', 'rewind'].forEach(function(
//       type
//     ) {
//       var originalFunc = cursorProto[type];
//       cursorProto[type] = function() {
//         var cursorDescription = this._cursorDescription;

//         const transaction = apm.currentTransaction;
//         if (transaction) {
//           const span = apm.startSpan(`${cursorDescription.collectionName}:${type}`, 'db');
//           transaction.__span = span;
//         }

//         try {
//           var ret = originalFunc.apply(this, arguments);

//           if (transaction && transaction.__span) {
//             transaction.__span.end();
//           }
//           return ret;
//         } catch (ex) {
//           if (transaction && transaction.__span) {
//             transaction.__span.end();
//           }
//           throw ex;
//         }
//       };
//     });
//   }

//   hijackDBOps();
// }

// module.exports = start;
