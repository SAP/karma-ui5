module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		frameworks: ["ui5"],

		ui5: {
			failOnEmptyTestPage: false,
			testpage: "webapp/test/empty-testpage/testsuite.qunit.html"
		}

	});

	require("../saucelabs").setTestName(config, __filename);
};

module.exports.shouldFail = false;
module.exports.assertions = ({expect, log}) => {
	expect(log).toMatch(/Executed 1 of 1/);
	expect(log).toMatch(/Testpage "\/base\/webapp\/test\/empty-testpage\/empty\.qunit\.html" did not define any tests/);
	expect(log).toMatch(/Please consider enabling the "failOnEmptyTestPage" option/);
};
