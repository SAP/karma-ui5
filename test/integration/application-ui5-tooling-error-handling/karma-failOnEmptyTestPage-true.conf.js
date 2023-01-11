module.exports = function(config) {
	"use strict";

	require("../karma-base.conf.cjs")(config);
	config.set({

		frameworks: ["ui5"],

		ui5: {
			failOnEmptyTestPage: true,
			testpage: "webapp/test/empty-testpage/testsuite.qunit.html"
		}

	});

	require("../saucelabs.cjs").setTestName(config, __filename);
};

module.exports.shouldFail = true;
module.exports.assertions = ({t, log}) => {
	t.regex(log, /Executed 2 of 2/);
	t.regex(log, /\/base\/webapp\/test\/empty-testpage\/empty\.qunit\.html FAILED/);
	t.regex(log, /Testpage did not define any tests./);
};
