module.exports = function(config) {
	"use strict";

	require("../karma-base.conf.cjs")(config);
	config.set({

		frameworks: ["ui5"],

		ui5: {
			testpage: "webapp/test/testpage-QUnit-not-loaded/testsuite.qunit.html"
		}

	});

	require("../saucelabs.cjs").setTestName(config, __filename);
};

module.exports.shouldFail = true;
module.exports.assertions = ({t, log}) => {
	t.regex(log, /Missing QUnit framework/);
};
