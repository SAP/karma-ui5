module.exports = function(config) {
	"use strict";

	config.set({

		ui5: {
			type: "application",
			url: "https://openui5nightly.hana.ondemand.com"
		},

		frameworks: ["qunit-html"],

		plugins: [
			require("../../../"),
			require("karma-chrome-launcher")
		],

		browsers: ["ChromeHeadless"],

		singleRun: true,

		browserConsoleLogOptions: {
			level: 'error'
		}

	});
};
