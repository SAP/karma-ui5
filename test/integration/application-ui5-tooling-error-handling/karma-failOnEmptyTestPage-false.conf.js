module.exports = function(config) {
	"use strict";

	require("../karma-base.conf.cjs")(config);
	config.set({

		frameworks: ["ui5"],

		ui5: {
			failOnEmptyTestPage: false,
			testpage: "webapp/test/empty-testpage/testsuite.qunit.html"
		}

	});

	require("../saucelabs.cjs").setTestName(config, __filename);
};

module.exports.shouldFail = false;
module.exports.assertions = ({t, log}) => {
	t.regex(log, /Executed 1 of 1/);
	t.regex(log, /Testpage "\/base\/webapp\/test\/empty-testpage\/empty\.qunit\.html" did not define any tests/);
	t.regex(log, /Please consider enabling the "failOnEmptyTestPage" option/);
};
