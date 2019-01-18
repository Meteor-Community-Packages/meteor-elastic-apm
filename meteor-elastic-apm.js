const Agent = require("elastic-apm-node");

import {
  MongoOplogDriver,
  MongoPollingDriver,
  Multiplexer,
  Server,
  Session,
  Subscription
} from "./meteorx.js";

import hijack from "./hijack";

const { async, db, errors, http, session, subscription } = hijack;
// this is where our wrap code starts

const startAgent = Agent.start;
Agent.start = function(config) {
  config = config || {};

  if (config.active !== false) {
    Meteor.startup(() => {
      session(Agent);
      subscription(Agent);
      errors(Agent);
      async(Agent);
      db(Agent);
      http(Agent);

      try {
        startAgent.apply(Agent, [config]);
        console.log("meteor-elastic-apm completed instrumenting");
      } catch (e) {
        console.error("Could not start meteor-elastic-apm");
        console.error(e);
      }
    });
  } else {
    console.warn("meteor-elastic-apm is not active");
  }
};

module.exports = Agent;
