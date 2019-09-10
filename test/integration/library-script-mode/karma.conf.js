module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		ui5: {
			mode: "script",
			url: "https://openui5nightly.hana.ondemand.com",
			config: {
				libs: "sap.test.lib",
				resourceRoots: {
					"sap.test.lib": "./base/src/sap/test/lib",
					"sap.test.lib.qunit": "./base/test/sap/test/lib/qunit/"
				}
			},
			tests: [
				"sap/test/lib/qunit/test.qunit"
			]
		},

		frameworks: ["qunit", "ui5"]

	});

	require("../saucelabs").setTestName(config, __filename);
};
