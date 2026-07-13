// Metro config for the Expo app inside the npm-workspaces monorepo.
//
// The app imports two things that live OUTSIDE apps/mobile: the shared
// @bedtime-quests/core package (packages/core) and the authored story content
// (content/stories/*). Metro only watches the project folder by default, so we
// add the workspace root to watchFolders and point module resolution at both the
// app's and the root's node_modules. This is the standard Expo monorepo setup.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
