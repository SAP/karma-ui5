module.exports = function(config) {
	config.set({
		mutator: "javascript",
		packageManager: "npm",
		reporters: ["html", "clear-text", "progress"],
		testRunner: "jest",
		coverageAnalysis: "off",
		jest: {
			config: {
				// Make sure to exclude integration tests
				testPathIgnorePatterns: [
					"/integration/"
				]
			}
		},

		// Paths must be relative to the project root
		mutate: [
			"lib/**/*.js",
			"!lib/index.js",
			"!lib/client/**"
		],

		thresholds: {
			high: 90,
			low: 70,
			break: 70
		}

	});
};
