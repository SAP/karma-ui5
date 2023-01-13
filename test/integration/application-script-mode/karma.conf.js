const path = require("node:path");

module.exports = function(config) {
	require("../karma-base.conf.cjs")(config);
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

	require("../saucelabs.cjs").setTestName(config, __filename);
};

module.exports.assertions = function({t, log}) {
	const coverage = require("./coverage/json/coverage-final.json");
	const files = Object.keys(coverage);
	t.is(files.length, 1);
	t.true(files[0].endsWith(path.join("application-script-mode", "webapp", "foo.js")));
};
