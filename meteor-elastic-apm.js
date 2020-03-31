/* eslint-disable no-undef */
const shimmer = require('shimmer');
const Fibers = require('fibers');
const Agent = require('elastic-apm-node');

const { Session, Subscription, MongoCursor } = require('./meteorx');

const instrumentMethods = require('./instrumenting/methods');
const instrumentHttpIn = require('./instrumenting/http-in');
const instrumentHttpOut = require('./instrumenting/http-out');
const instrumentSession = require('./instrumenting/session');
const instrumentSubscription = require('./instrumenting/subscription');
const instrumentAsync = require('./instrumenting/async');
const instrumentDB = require('./instrumenting/db');
const startMetrics = require('./metrics');

const hackDB = require('./hacks');

const [framework, version] = Meteor.release.split('@');

Agent.setFramework({
  name: framework,
  version,
  override: true
});

shimmer.wrap(Agent, 'start', function(startAgent) {
  return function(...args) {
    const config = args[0] || {};

    if (config.active !== false) {
      try {
        const disabled = new Set(config.disableMeteorInstrumentations);

        // Must be called before any other route is registered on WebApp.
        instrumentHttpIn(Agent, WebApp);

        Meteor.startup(() => {
          try {
            startAgent.apply(Agent, args);

            Object.entries({
              methods: () => instrumentMethods(Agent, Meteor),
              'http-out': () => instrumentHttpOut(Agent, WebApp),
              session: () => instrumentSession(Agent, Session),
              subscription: () => instrumentSubscription(Agent, Subscription),
              async: () => instrumentAsync(Agent, Fibers),
              db: () => {
                hackDB();
                instrumentDB(Agent, Meteor, MongoCursor);
              },
              metrics: () => startMetrics(Agent)
            }).forEach(([name, fn]) => {
              if (!disabled.has(name)) {
                fn();
              }
            });

            Agent.logger.info('meteor-elastic-apm completed instrumenting');
          } catch (e) {
            Agent.logger.error('Could not start meteor-elastic-apm');
            throw e;
          }
        });
      } catch (e) {
        Agent.logger.error('Could not start meteor-elastic-apm');
        throw e;
      }
    } else {
      Agent.logger.warn('meteor-elastic-apm is not active');
    }
  };
});

module.exports = Agent;
