const Agent = require("elastic-apm-node");

const errors = require('./hijack/errors');
const http = require('./hijack/http');
const session = require('./hijack/session');
// const sessionsCount = require('./hijack/sessionsCount');
const subscription = require('./hijack/subscription');
// oops `async` name is reserved
const asyncH = require('./hijack/async');
const db = require('./hijack/db');
// this is where our wrap code starts

MeteorX.onReady(function() {
  session(Agent);
  subscription(Agent);
  errors(Agent);
  http(Agent);
  asyncH(Agent);
  // sessionsCount(Agent)
  db(Agent);

  console.log("meteor-elastic-apm completed instrumeting");
});

module.exports = Agent;
