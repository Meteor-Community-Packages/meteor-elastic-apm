// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from 'meteor/tinytest';

// Import and rename a variable exported by meteor-elastic-apm.js.
import { name as packageName } from 'meteor/kschingiz:meteor-elastic-apm';

// Write your tests here!
// Here is an example.
Tinytest.add('meteor-elastic-apm - example', function(test) {
  test.equal(packageName, 'meteor-elastic-apm');
});
