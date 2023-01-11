module.exports = function(config) {
	"use strict";

	require("../karma-base.conf.cjs")(config);
	config.set({

		frameworks: ["ui5"],

		ui5: {
			testpage: "webapp/test/testpage-not-found/testsuite.qunit.html"
		}

	});

	require("../saucelabs.cjs").setTestName(config, __filename);
};

module.exports.shouldFail = true;
module.exports.assertions = ({t, log}) => {
	// NOTE: In IE11 it might be the case that onbeforeunload is called when a 404 appears
	// which leads to the "Some of your tests did a full page reload!" error from karma
	t.regex(log, /((Error while loading testpage)|(Some of your tests did a full page reload!))/);
};
