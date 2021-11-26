const path = require("path");

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
			fileExport: {
				outputDir: "./karma-ui5-reports-customized-path"
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
	expect(files[0]).toEndWith(path.join("application-file-export-reporter-script-mode", "webapp", "foo.js"));

	const exportFile1 = require("./karma-ui5-reports-customized-path/file1.json");
	const exportFile2 = require("./karma-ui5-reports-customized-path/file2.json");
	const exportFile3 = require("./karma-ui5-reports-customized-path/file2_1.json");
	const exportFile4 = require("./karma-ui5-reports-customized-path/file2_2.json");
	expect(exportFile1).toEqual({data: "foobar"});
	expect(exportFile2).toEqual({data: "foobarbaz"});
	expect(exportFile3).toEqual({data: "foobarbaz_1"});
	expect(exportFile4).toEqual({data: "foobarbaz_2"});
};
