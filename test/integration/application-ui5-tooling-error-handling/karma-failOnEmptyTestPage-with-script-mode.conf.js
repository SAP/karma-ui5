module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		frameworks: ["ui5"],

		ui5: {
			mode: "script",
			// Can only be used in html mode
			failOnEmptyTestPage: true
		}

	});

	require("../saucelabs").setTestName(config, __filename);
};

module.exports.shouldFail = true;
module.exports.assertions = ({expect, log}) => {
	expect(log).toMatch(/The failOnEmptyTestPage configuration can only be used in "html" mode/);
};
