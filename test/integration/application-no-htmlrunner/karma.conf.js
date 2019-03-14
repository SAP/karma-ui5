module.exports = function(config) {
	require("../karma-base.conf")(config);
	config.set({

		frameworks: ["qunit", "ui5"],

		ui5: {
			htmlrunner: false,
			url: "https://openui5nightly.hana.ondemand.com",
			config: {
				theme: "sap_belize",
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

		files: [
			{pattern: "**", included: false, served: true, watched: true}
		],

		plugins: [
			require("../../../lib"),
			require("karma-chrome-launcher"),
			require("karma-qunit")
		]

	});
};
