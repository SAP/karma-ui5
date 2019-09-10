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
		if (!process.env["SAUCE_API_HOST"]) {
			// Ensure to use the EU data center
			process.env["SAUCE_API_HOST"] = "eu-central-1.saucelabs.com";
		}

		config.set({

			customLaunchers: {
				SauceLabs_firefox: {
					base: "SauceLabs",
					browserName: "firefox",
					platform: "Windows 10",
					version: "68"
				},
				SauceLabs_ie11: {
					base: "SauceLabs",
					browserName: "internet explorer",
					platform: "Windows 10",
					version: "11"
				}
			},

			sauceLabs: {
				testName: "karma-ui5",
				// recordVideo: false,
				// recordScreenshots: false,
				startConnect: false,
				// connectOptions: {
				// 	"-x": "https://eu-central-1.saucelabs.com/rest/v1"
				// },
				// connectLocationForSERelay: "ondemand.eu-central-1.saucelabs.com",
				// connectPortForSERelay: "80/wd/hub"
				connectLocationForSERelay: "localhost",
				connectPortForSERelay: "4445/wd/hub"
			},

			browsers: ["SauceLabs_firefox", "SauceLabs_ie11"],

			captureTimeout: 0,

			reporters: ["progress", "coverage", "saucelabs"]

		});
	}
};
