module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		frameworks: ["ui5"],

		ui5: {
			configPath: "ui5-does-not-exist.yaml"
		},

		reporters: ["progress"]

	});
};

module.exports.assertions = function({expect, log}) {
	expect(log).toContain("Failed to read configuration for project application-ui5-tooling");
	expect(log).toContain("ui5-does-not-exist.yaml");
};

module.exports.shouldFail = true;
