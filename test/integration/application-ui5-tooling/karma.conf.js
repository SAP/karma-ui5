module.exports = function(config) {
	"use strict";

	config.set({

		frameworks: ["qunit-html"],

		plugins: [
			require("../../../lib"),
			require("karma-chrome-launcher")
		],

		browsers: ["ChromeHeadless"],

		singleRun: true,

		// FIXME: Serve testrunner.html from CDN as it's not part of the npm dependencies (no test-resources)
		proxies: {
			"/base/webapp/test-resources/sap/ui/qunit/": {
				target: "https://openui5nightly.hana.ondemand.com/test-resources/sap/ui/qunit/",
				changeOrigin: true
			}
		},

		browserConsoleLogOptions: {
			level: 'error'
		}

	});
};