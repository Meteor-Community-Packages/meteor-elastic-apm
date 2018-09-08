# meteor-elastic-apm
Performance Monitoring for Meteor in Elastic APM

[![Meteor Elastic APM screenshot](https://github.com/kschingiz/meteor-elastic-apm/blob/master/assets/screenshot.png)](https://github.com/kschingiz/meteor-elastic-apm)

# why do we need this
We use Kadira APM in our company. We love it, thanks to @arunoda, you made incredible service that helped thousands of Meteor developers to make their app better, BUT we feel that someday Kadira will be too deprecated and will not support current Meteor features, because no one maintains it.
So I decided that it's time to say goodbye to Kadira and build better APM for Meteor.

# project status - ALPHA
This package is in deep development and can't be used in production.

# getting started
  1. Install and configure elasticsearch - https://www.elastic.co/downloads/elasticsearch
  2. Install and configure Kibana - https://www.elastic.co/downloads/kibana
  3. Install and configure elastic APM server - https://www.elastic.co/downloads/apm

Then
```
meteor add kschingiz:meteor-elastic-apm
```

Then somewhere in your server code, Elastic documentation stays that Agent.start should be executed before anything else, and should be at the very top of your code
```
import Agent from 'meteor/kschingiz:meteor-elastic-apm';
Agent.start(options);
```

# What it monitors
  1. Meteor methods execution - it tracks their execution time with detailed information of what db queries was executed
  2. Meteor pub/sub, tracks publications response time
  3. Meteor pub/sub - operations, how much documents was added, updated, removed
  4. Async ops inside methods and pubs, for example http requests
  5. Errors - with detailed information and stack traces


# API
Agent is based on `elastic/apm-agent-nodejs` and fully supports all of it's features https://github.com/elastic/apm-agent-nodejs

# contributions
All contributions are welcome, Let's make the better APM together!
