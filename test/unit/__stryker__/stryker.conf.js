/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
module.exports = {
	commandRunner: {
		command: "npm run unit",
	},
	files: [
		"lib/**",
		"!lib/client/**",
		"test/unit/**",
		"package.json",
		"package-lock.json"
	],
	// Paths must be relative to the project root
	mutate: [
		"lib/framework.js",
		"lib/middleware/rewriteUrl.js"
	],
	thresholds: {
		high: 90,
		low: 70,
		break: 70
	}
};
