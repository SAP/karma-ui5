const customCucumberReporter = require("./karma-reporter/index");
const customKarmaUI5 = require("../../../lib/index");

module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({
		plugins: [
			"karma-chrome-launcher",
			"karma-coverage",
			customKarmaUI5,
			customCucumberReporter
		],

		ui5: {
			type: "application",
			mode: "html",
			testpage: "webapp/test/test.qunit.html",
			url: "http://localhost:" + config.localUI5ServerPort
		},

		frameworks: ["ui5"],

		preprocessors: {
			"{webapp,webapp/!(test)}/*.js": ["coverage"]
		},
		cucumberReporter: {
			out: "cucumber.json",
			prefix: "Feature"
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
};
