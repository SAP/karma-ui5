process.env.CHROME_BIN = require("puppeteer").executablePath();

module.exports = function(config) {
	config.set({

		plugins: [
			require("../../"),
			require("karma-chrome-launcher"),
			require("karma-coverage"),
			require("karma-ie-launcher"),
			require("karma-qunit"),
			require("karma-sauce-launcher")
		],

		customLaunchers: {
			ChromeHeadlessNoSandbox: {
				base: "ChromeHeadless",
				flags: [
					"--no-sandbox"
				]
			}
		},

		browsers: ["ChromeHeadlessNoSandbox"],

		browserConsoleLogOptions: {
			level: "error"
		},

		reporters: ["progress", "coverage"],

		singleRun: true,

		// Increase disconnect timeout and tolerance to avoid sporadic CI issues on macOS
		browserDisconnectTimeout: 10000,
		browserDisconnectTolerance: 2

	});

	require("./saucelabs").setup(config);
};
