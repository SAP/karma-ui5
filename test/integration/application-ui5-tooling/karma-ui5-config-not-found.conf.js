module.exports = function(config) {
	"use strict";

	require("../karma-base.conf.cjs")(config);
	config.set({

		frameworks: ["ui5"],

		ui5: {
			configPath: "ui5-does-not-exist.yaml"
		},

		// logLevel: "debug",

		reporters: ["progress"]

	});

	require("../saucelabs.cjs").setTestName(config, __filename);
};

module.exports.assertions = function({t, log}) {
	t.true(log.includes("Failed to read configuration for module application-ui5-tooling"), log);
	t.true(log.includes("ui5-does-not-exist.yaml"), log);
};

module.exports.shouldFail = true;
