const Agent = require("elastic-apm-node");

const errors = require('./hijack/errors');
const http = require('./hijack/http');
const session = require('./hijack/session');
const subscription = require('./hijack/subscription');
// whoops `async` name is reserved
const asyncH = require('./hijack/async');
const db = require('./hijack/db');

// this is where our wrap code starts
MeteorX.onReady(function() {
  session(Agent);
  subscription(Agent);
  errors(Agent);
  asyncH(Agent);
  db(Agent);
  http(Agent);

  console.log("meteor-elastic-apm completed instrumeting");
});

module.exports = Agent;
