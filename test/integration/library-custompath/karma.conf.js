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
		},

		reporters: ["progress", "coverage"]

	});
};

module.exports.assertions = function({expect, log}) {
	const coverage = require("./coverage/json/coverage-final.json");
	const files = Object.keys(coverage);
	expect(files).toHaveLength(1);
	expect(files[0]).toEndWith("library-custompath/src/main/js/sap/test/lib/library.js");

	expect(log).toContain("TOTAL: 1 SUCCESS");
};
