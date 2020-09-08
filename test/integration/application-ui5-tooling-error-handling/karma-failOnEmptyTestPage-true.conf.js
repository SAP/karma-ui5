module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		frameworks: ["ui5"],

		ui5: {
			failOnEmptyTestPage: true,
			testpage: "webapp/test/empty-testpage/testsuite.qunit.html"
		}

	});

	require("../saucelabs").setTestName(config, __filename);
};

module.exports.shouldFail = true;
module.exports.assertions = ({expect, log}) => {
	expect(log).toMatch(/Executed 2 of 2/);
	expect(log).toMatch(/\/base\/webapp\/test\/empty-testpage\/empty\.qunit\.html FAILED/);
	expect(log).toMatch(/Testpage did not define any tests./);
};
