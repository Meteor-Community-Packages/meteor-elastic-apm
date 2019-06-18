const shimmer = require('shimmer');
const Fibers = require('fibers');
const Agent = require('elastic-apm-node');

const { Session, Subscription, MongoCursor } = require('./meteorx');

const instrumentErrors = require('./instrumenting/errors');
const instrumentHttp = require('./instrumenting/http');
const instrumentSession = require('./instrumenting/session');
const instrumentSubscription = require('./instrumenting/subscription');
const instrumentAsync = require('./instrumenting/async');
const instrumentDB = require('./instrumenting/db');

// this is where our wrap code starts
shimmer.wrap(Agent, 'start', function(startAgent) {
  return function(...args) {
    const config = args[0] || {};

    if (config.active !== false) {
      Meteor.startup(() => {
        try {
          instrumentErrors(Agent, Meteor);
          instrumentHttp(Agent, WebApp);
          instrumentSession(Agent, Session);
          instrumentSubscription(Agent, Subscription);
          instrumentAsync(Agent, Fibers);
          instrumentDB(Agent, Meteor, MongoCursor);

          startAgent.apply(Agent, args);
          console.log('meteor-elastic-apm completed instrumenting');
        } catch (e) {
          console.error('Could not start meteor-elastic-apm');
          console.error(e);
        }
      });
    } else {
      console.warn('meteor-elastic-apm is not active');
    }
  };
});

module.exports = Agent;
