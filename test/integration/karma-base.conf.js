process.env.CHROME_BIN = require("puppeteer").executablePath();

module.exports = function(config) {
	config.set({

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

		singleRun: true

	});
};
