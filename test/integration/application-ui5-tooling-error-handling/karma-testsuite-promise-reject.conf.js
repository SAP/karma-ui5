module.exports = function(config) {
	"use strict";

	require("../karma-base.conf.cjs")(config);
	config.set({

		frameworks: ["ui5"],

		ui5: {
			testpage: "webapp/test/testsuite-promise-reject/testsuite.qunit.html"
		}

	});

	require("../saucelabs.cjs").setTestName(config, __filename);
};

module.exports.shouldFail = true;
module.exports.assertions = ({t, log}) => {
	t.regex(log, /Error from testsuite/);
};
