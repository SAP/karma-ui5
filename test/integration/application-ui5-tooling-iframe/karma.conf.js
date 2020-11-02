module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
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
		},

		reporters: ["progress", "coverage"]

	});
	require("../../../helper").configureIframeCoverage(config);

	require("../saucelabs").setTestName(config, __filename);
};

module.exports.assertions = function({expect, log}) {
	const coverage = require("./coverage/json/coverage-final.json");
	const sWindowsExpect = "application-ui5-tooling-iframe\\webapp\\foo.js";
	const sLinuxExpect = "application-ui5-tooling-iframe/webapp/foo.js";
	const files = Object.keys(coverage);
	expect(files).toHaveLength(1);
	const sActual = files[0] && files[0].replace(sWindowsExpect, sLinuxExpect);
	expect(sActual).toEndWith(sLinuxExpect);
};
