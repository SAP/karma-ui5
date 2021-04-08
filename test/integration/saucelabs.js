const path = require("path");

module.exports.setTestName = function(config, karmaConfPath) {
	if (!config.useSauceLabs) {
		return;
	}
	const relativeKarmaConfPath = path.relative(__dirname, karmaConfPath);
	config.set({
		sauceLabs: {
			testName: "SAP/karma-ui5 - " + relativeKarmaConfPath
		}
	});
};

module.exports.setup = function(config) {
	if (config.useSauceLabs) {
		config.set({

			customLaunchers: {
				SauceLabs_ie11: {
					base: "SauceLabs",
					browserName: "internet explorer",
					browserVersion: "11",
					platformName: "Windows 10"
				}
			},

			sauceLabs: {
				testName: "karma-ui5",
				region: "eu",
				build: process.env.GITHUB_RUN_ID,
				recordVideo: false,
				recordScreenshots: false,
				customData: {
					sha: process.env.GITHUB_SHA
				},
				// Sauce connect is started via GitHub Action in .github/workflows/saucelabs.yml
				startConnect: false,
				tunnelIdentifier: `github-${process.env.GITHUB_RUN_ID}`
			},

			// Running with IE11 to ensure legacy compatibility of karma-ui5
			// UI5 dropped IE11 support starting with 1.88 (see https://blogs.sap.com/2021/02/02/internet-explorer-11-will-no-longer-be-supported-by-various-sap-ui-technologies-in-newer-releases/)
			// But as this plugin should stay compatible with all maintained
			// UI5 versions it still needs to be tested with IE11
			browsers: ["SauceLabs_ie11"],

			logLevel: "DEBUG",

			captureTimeout: 300000, // 5 minutes
			browserDisconnectTolerance: 3,
			browserDisconnectTimeout: 300000, // 5 minutes
			browserSocketTimeout: 120000, // 2 minutes
			browserNoActivityTimeout: 300000, // 5 minutes
			pingTimeout: 90000, // 90 seconds, see: https://github.com/karma-runner/karma/issues/3359#issuecomment-772699091

			reporters: ["progress", "coverage", "saucelabs"]

		});
	}
};
