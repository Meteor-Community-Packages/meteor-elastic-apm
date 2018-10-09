const Agent = require("elastic-apm-node");

const errors = require('./hijack/errors');
const http = require('./hijack/http');
const session = require('./hijack/session');
const subscription = require('./hijack/subscription');
// whoops `async` name is reserved
const asyncH = require('./hijack/async');
const db = require('./hijack/db');

// this is where our wrap code starts

const startAgent = Agent.start;
Agent.start = function(config){
  config = config || {};

  if(config.active !== false){
    MeteorX.onReady(() => {
      session(Agent);
      subscription(Agent);
      errors(Agent);
      asyncH(Agent);
      db(Agent);
      http(Agent);

      try {
        startAgent.apply(Agent, [config]);
        console.log("meteor-elastic-apm completed instrumeting");
      } catch(e){
        console.error("Could not start meteor-elastic-apm");
        console.error(e);
      }
    });
  } else {
    console.warn("meteor-elastic-apm is not active");
  }
};



module.exports = Agent;
