Package.describe({
  name: 'kschingiz:meteor-elastic-apm',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  'elastic-apm-node': '1.12.0'
});


Package.onUse(function(api) {
  api.versionsFrom('1.7.0.5');
  api.use('ecmascript');
  api.use('meteorhacks:meteorx@1.4.1', ['server']);
  
  api.mainModule('meteor-elastic-apm.js');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('kschingiz:meteor-elastic-apm');
  api.mainModule('meteor-elastic-apm-tests.js');
});
