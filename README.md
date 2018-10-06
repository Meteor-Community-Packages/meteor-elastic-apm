# meteor-elastic-apm
Performance Monitoring for Meteor based on Elastic APM

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

# Kibana APM with Meteor with MUP
Meteor Up is a production quality Meteor app deployment tool. We expect you already has up and running Meteor app on server deployed with MUP.

1. `mup ssh`
2. `wget https://raw.githubusercontent.com/elastic/apm-server/master/apm-server.yml && cp apm-server.yml /etc/apm-server/apm-server.yml`
3. Now you need to edit /etc/apm-server/apm-server.yml, at least you need to add you elastic search url under `output.elasticsearch`. When you finish just close this terminal
4. Now we need to update mup.js file to:
  a) Install apm-server in app container
  b) Pass apm-server config file into our app container
  c) Start it everytime after deploy
```
{
  app: {
    ...
    volumes: {
      '/etc/apm-server/apm-server.yml': '/etc/apm-server/apm-server.yml'
    },
    docker: {
        ...
        buildInstructions: [
        // https://www.elastic.co/guide/en/apm/server/current/setup-repositories.html
        'RUN apt-get install wget -y',
        'RUN wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | apt-key add -',
        'RUN apt-get install apt-transport-https',
        'RUN echo "deb https://artifacts.elastic.co/packages/6.x/apt stable main" | tee -a /etc/apt/sources.list.d/elastic-6.x.list',
        'RUN apt-get update && apt-get install apm-server -y',
        'RUN update-rc.d apm-server defaults 95 10'
        ]
    }
    ...
  },
  ...
  hooks: {
    // Run apm-server
    'post.deploy'(api) {
      return api.runSSHCommand(
        api.getConfig().servers.one,
        'docker exec development service apm-server start'
      );
    }
  },
}
```

# What it monitors
  1. Meteor methods execution - it tracks their execution time with detailed information of what db queries was executed
  2. Meteor pub/sub, tracks publications response time
  3. Meteor pub/sub - operations, how much documents was added, updated, removed
  4. Async ops inside methods and pubs, for example http requests
  5. Incoming and outcoming HTTP requests
  6. Errors - with detailed information and stack traces


# API
Agent is based on `elastic/apm-agent-nodejs` and fully supports all of it's features https://github.com/elastic/apm-agent-nodejs

# contributions
All contributions are welcome, Let's make the better APM together!
