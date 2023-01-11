const path = require("path");

module.exports = function(config) {
	"use strict";

	require("../karma-base.conf.cjs")(config);
	config.set({

		frameworks: ["ui5"],

		preprocessors: {
			"{webapp,webapp/!(test)}/*.js": ["coverage"]
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
	t.true(files[0].endsWith(path.join("application-ui5-tooling", "webapp", "foo.js")));
};
