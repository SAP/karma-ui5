const path = require("path");
const {replaceLast, createPluginFilesPattern} = require("../utils");

module.exports.init = function(config) {
	let url;
	if (config.ui5.url) {
		url = config.ui5.url + "/resources/sap-ui-core.js";
	} else {
		// Uses middleware if no url has been specified
		// Need to use an absolute URL as the file doesn't exist physically but will be
		// resolved via our middleware
		url = `${config.protocol}//${config.hostname}:${config.port}/base/`;
		if (config.ui5.type === "application") {
			url += `${config.ui5.paths.webapp}/resources/sap-ui-core.js`;
		} else if (config.ui5.type === "library") {
			url += `${replaceLast(config.ui5.paths.src, "resources")}/sap-ui-core.js`;
		}
	}
	config.client.ui5.config = config.ui5.config;
	config.client.ui5.tests = config.ui5.tests;
	if (config.ui5.tests) {
		config.files.unshift(createPluginFilesPattern(path.join(__dirname, "..", "client", "autorun.js")));
	}
	config.files.unshift(createPluginFilesPattern(url));
	config.files.unshift(createPluginFilesPattern(path.join(__dirname, "..", "client", "sap-ui-config.js")));
};
