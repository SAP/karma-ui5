module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		ui5: {
			mode: "script",
			config: {
				libs: "sap.test.lib",
				resourceRoots: {
					"sap.test.lib.qunit": "./base/test/sap/test/lib/qunit/"
				}
			},
			tests: [
				"sap/test/lib/qunit/test.qunit"
			]
		},

		frameworks: ["qunit", "ui5"],

		plugins: [
			require("../../../lib"),
			require("karma-chrome-launcher"),
			require("karma-qunit")
		]

	});
};
