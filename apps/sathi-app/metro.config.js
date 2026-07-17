const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add ignore patterns to blocklist for Metro file map watcher.
// This prevents Windows ENOENT watch crashes caused by active Gradle build directory tasks.
config.resolver.blockList = [
  /.*node_modules\/.*\/bin\/\.gradle\/.*/,
  /.*\.gradle.*/,
  /.*android\/app\/build.*/,
];

module.exports = config;
