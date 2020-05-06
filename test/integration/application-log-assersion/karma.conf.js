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
		cucumberReporter: {
			out: "application-log-assersion/cucumber.json",
			prefix: ""
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

		reporters: ["progress", "coverage", "cucumber"]

	});
};

module.exports.assertions = function({expect, log}) {
	const features = require("./cucumber.json");
	const scenarios = features[0].elements;
	const steps = scenarios[0].steps;
	expect(features).toHaveLength(1);
	expect(scenarios).toHaveLength(12);
	expect(steps).toHaveLength(2);
};
