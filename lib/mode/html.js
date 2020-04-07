const path = require("path");
const {createPluginFilesPattern} = require("../utils");

module.exports.init = function(config) {
	// Add browser bundle including third-party dependencies
	config.files.unshift(createPluginFilesPattern(path.join(__dirname, "..", "..", "dist", "browser-bundle.js")));

	// Make testpage url available to the client
	config.client.ui5.testpage = config.ui5.testpage;

	// Pass configured urlParameters to client
	config.client.ui5.urlParameters = config.ui5.urlParameters;
};
