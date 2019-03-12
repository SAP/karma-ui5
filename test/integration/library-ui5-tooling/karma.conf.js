process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function(config) {
	"use strict";

	config.set({

		frameworks: ['ui5'],

		plugins: [
			require("../../../lib"),
			require("karma-chrome-launcher")
		],

		browsers: ['ChromeHeadless'],

		singleRun: true,

		// FIXME: Serve testrunner.html from CDN as it's not part of the npm dependencies (no test-resources)
		proxies: {
			"/base/test/sap/ui/qunit/": {
				target: "https://openui5nightly.hana.ondemand.com/test-resources/sap/ui/qunit/",
				changeOrigin: true
			}
		},

		browserConsoleLogOptions: {
			level: 'error'
		}

	});
};
