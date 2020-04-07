module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		ui5: {
			mode: "script",
			url: "http://localhost:" + config.localUI5ServerPort,
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

		frameworks: ["qunit", "ui5"],

		preprocessors: {
			"src/**/*.js": ["coverage"]
		},

		coverageReporter: {
			includeAllSources: true,
			reporters: [
				{
					type: "json",
					dir: "coverage",
					subdir: "json"
				}
			],
			check: {
				each: {
					statements: 100,
					branches: 100,
					functions: 100,
					lines: 100
				}
			}
		},

		reporters: ["progress", "coverage"]

	});
};

module.exports.assertions = function({expect, log}) {
	const coverage = require("./coverage/json/coverage-final.json");
	const files = Object.keys(coverage);
	expect(files).toHaveLength(1);
	expect(files[0]).toEndWith("library-script-mode/src/sap/test/lib/library.js");

	expect(log).toContain("TOTAL: 1 SUCCESS");
};
