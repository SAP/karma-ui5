module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		frameworks: ["ui5"],

		ui5: {
			configPath: require("path").resolve(__dirname, "ui5-foo.yaml")
		},

		reporters: ["progress"]

	});

	require("../saucelabs").setTestName(config, __filename);
};
