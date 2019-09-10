module.exports = function(config) {
	require("../karma-base.conf")(config);
	config.set({

		frameworks: ["qunit", "ui5"],

		ui5: {
			mode: "script",
			url: "https://openui5nightly.hana.ondemand.com",
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
		}

	});

	require("../saucelabs").setTestName(config, __filename);
};
