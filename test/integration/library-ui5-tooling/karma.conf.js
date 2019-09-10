module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		frameworks: ["ui5"]

	});

	require("../saucelabs").setTestName(config, __filename);
};
