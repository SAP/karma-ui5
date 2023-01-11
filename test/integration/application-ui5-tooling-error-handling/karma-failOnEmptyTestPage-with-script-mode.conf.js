module.exports = function(config) {
	"use strict";

	require("../karma-base.conf.cjs")(config);
	config.set({

		frameworks: ["ui5"],

		ui5: {
			mode: "script",
			// Can only be used in html mode
			failOnEmptyTestPage: true
		}

	});

	require("../saucelabs.cjs").setTestName(config, __filename);
};

module.exports.shouldFail = true;
module.exports.assertions = ({t, log}) => {
	t.regex(log, /The failOnEmptyTestPage configuration can only be used in "html" mode/);
};
