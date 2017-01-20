'use strict';

let _ = require('lodash')
  , config = require('config')
  , redisConfig = {}
  , libs = require('require-all')({
    dirname: __dirname + '/lib',
    excludeDirs: /utils/,
    recursive: true
  })
  , plugins = [];

function addPlugins(pluginObj) {
  _.forEach(pluginObj, (val, key) => {
    if (_.has(val, 'init')) {
      plugins.push(val);
      console.log('added plugin', key); // eslint-disable-line no-console
      return true;
    } else {
      return addPlugins(val);
    }
  });
}

addPlugins(libs);

require('skellington')({
  slackToken: config.slackToken,
  storage: require('botkit-storage-redis')(redisConfig),
  plugins: plugins
});