# meteor-elastic-apm
Performance Monitoring for Meteor in Elastic APM

[![Meteor Elastic APM screenshot](https://github.com/kschingiz/meteor-elastic-apm/assets/screenshot.png)](https://github.com/kschingiz/meteor-elastic-apm)

# why do we need this
It's time to say goodbye to Kadira.
  1. Kadira is too outdated
  2. No one is maintaining the Kadira server and Kadira agent
  3. If you don't want to use Galaxy, then you don't have any Meteor APM available

# getting started
```
meteor add kschingiz:meteor-elastic-apm
```
Then somewhere in your server code
```
import Agent from 'meteor/kschingiz:meteor-elastic-apm';
Agent.start(options);
```

# API
Agent is based on `elastic/apm-agent-nodejs` and fully supports all of it's features https://github.com/elastic/apm-agent-nodejs

# contributions
All contributions are welcome, Let's make the better APM together!
