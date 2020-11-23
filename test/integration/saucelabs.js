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
				SauceLabs_firefox: {
					base: "SauceLabs",
					browserName: "firefox",
					platformName: "Windows 10"
				},
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

			// Running with 2 browsers in parallel is unstable.
			// For now we only run on IE11.
			// browsers: ["SauceLabs_firefox", "SauceLabs_ie11"],
			browsers: ["SauceLabs_ie11"],

			captureTimeout: 300000, // 5 minutes
			browserDisconnectTolerance: 3,
			browserDisconnectTimeout: 300000, // 5 minutes
			browserSocketTimeout: 120000, // 2 minutes
			browserNoActivityTimeout: 300000, // 5 minutes

			reporters: ["progress", "coverage", "saucelabs"]

		});
	}
};
