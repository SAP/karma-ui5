module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		frameworks: ["ui5"],

		ui5: {
			testpage: "webapp/test/path-does-not-exist/testsuite.qunit.html"
		}

	});
};

module.exports.shouldFail = true;
module.exports.assertions = ({expect, log}) => {
	expect(log).toMatch(/Error resolving testsuite/);
};
