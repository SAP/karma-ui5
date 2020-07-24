module.exports = function(config) {
	require("../karma-base.conf")(config);
	config.set({

		frameworks: ["qunit", "ui5"],

		ui5: {
			mode: "script",
			url: "http://localhost:" + config.localUI5ServerPort,
			config: {
				theme: "base",
				language: "EN",
				bindingSyntax: "complex",
				compatVersion: "edge",
				async: true,
				resourceroots: {"test.app": "./base/webapp"}
			},
			tests: [
				"test/app/test/test.qunit"
			]
		},

		client: {
			qunit: {
				showUI: true
			}
		},

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

	require("../saucelabs").setTestName(config, __filename);
};

module.exports.assertions = function({expect, log}) {
	const coverage = require("./coverage/json/coverage-final.json");
	const files = Object.keys(coverage);
	expect(files).toHaveLength(1);

	const sWindowsExpect = "application-script-mode\\webapp\\foo.js";
	const sLinuxExpect = "application-script-mode/webapp/foo.js";
	const sActual = files[0] && files[0].replace(sWindowsExpect, sLinuxExpect);
	expect(sActual).toEndWith(sLinuxExpect);
};
