/* eslint-disable no-undef */
Package.describe({
  name: 'kschingiz:meteor-elastic-apm',
  version: '0.0.5',
  // Brief, one-line summary of the package.
  summary: 'Performance monitoring for Meteor based on Elastic APM',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/kschingiz/meteor-elastic-apm',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  'elastic-apm-node': '2.11.6',
  shimmer: '1.2.1'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.2');
  api.use('ecmascript');
  api.use('meteorhacks:meteorx@1.4.1', ['server']);

  api.mainModule('meteor-elastic-apm.js', 'server');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('kschingiz:meteor-elastic-apm');
  api.mainModule('meteor-elastic-apm-tests.js');
});
