module.exports = function(config) {
	"use strict";

	config.set({

		ui5: {
			type: "library",
			url: "https://openui5nightly.hana.ondemand.com"
		},

		frameworks: ['qunit-html'],

		plugins: [
			require("../../../lib"),
			require("karma-chrome-launcher")
		],

		browsers: ['ChromeHeadless'],

		singleRun: true,

		browserConsoleLogOptions: {
			level: 'error'
		}

	});
};
