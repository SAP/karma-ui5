const path = require("node:path");

module.exports = function(config) {
	"use strict";

	require("../karma-base.conf.cjs")(config);
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
		}

	});

	require("../saucelabs.cjs").setTestName(config, __filename);
};

module.exports.assertions = function({t, log}) {
	const coverage = require("./coverage/json/coverage-final.json");
	const files = Object.keys(coverage);
	t.is(files.length, 1);
	t.true(files[0].endsWith(path.join("library-tooling-script-mode", "src", "sap", "test", "lib", "library.js")));
};
