module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		frameworks: ["ui5"],

		ui5: {
			testpage: "webapp/test/empty-testsuite/testsuite.qunit.html"
		}

	});

	require("../saucelabs").setTestName(config, __filename);
};

module.exports.shouldFail = true;
module.exports.assertions = ({expect, log}) => {
	expect(log).toMatch(/Could not resolve any testpages/);
};
