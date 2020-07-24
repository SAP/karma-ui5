module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		ui5: {
			type: "library",
			url: "http://localhost:" + config.localUI5ServerPort,
			paths: {
				src: "src/main/js",
				test: "src/test/js"
			}
		},

		frameworks: ["ui5"],

		preprocessors: {
			"src/main/js/**/*.js": ["coverage"]
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

	require("../saucelabs").setTestName(config, __filename);
};

module.exports.assertions = function({expect, log}) {
	const coverage = require("./coverage/json/coverage-final.json");
	const files = Object.keys(coverage);
	expect(files).toHaveLength(1);

	const sWindowsExpect = "library-custompath\\src\\main\\js\\sap\\test\\lib\\library.js";
	const sLinuxExpect = "library-custompath/src/main/js/sap/test/lib/library.js";
	const sActual = files[0] && files[0].replace(sWindowsExpect, sLinuxExpect);
	expect(sActual).toEndWith(sLinuxExpect);
};
