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
			testpage: "webapp/test/GherkinTestRunner.html",
			url: "http://localhost:" + config.localUI5ServerPort,
			logAssertions: true
		},

		frameworks: ["ui5"],

		preprocessors: {
			"{webapp,webapp/!(test)}/*.js": ["coverage"]
		},
		testReporter: {
			out: "application-log-assertion/reports/test_report.json"
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
		autoWatch: false,
		singleRun: true,

		reporters: ["progress", "coverage", "testReporter"]

	});
};

module.exports.assertions = function({expect, log}) {
	const features = require("./reports/test_report.json");
	expect(features).toHaveLength(21);
};
