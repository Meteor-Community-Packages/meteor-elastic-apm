const shimmer = require('shimmer');
const Fibers = require('fibers');
const Agent = require('elastic-apm-node');

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
      MeteorX.onReady(() => {
        try {
          instrumentErrors(Agent);
          instrumentHttp(Agent, WebApp);
          instrumentSession(Agent);
          instrumentSubscription(Agent);
          instrumentAsync(Agent, Fibers);
          instrumentDB(Agent);

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
