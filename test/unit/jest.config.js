module.exports = {
	rootDir: "../../",
	roots: [
		"<rootDir>/lib/",
		"<rootDir>/test/unit/"
	],
	collectCoverageFrom: [
		"<rootDir>/lib/**"
	],
	coverageThreshold: {
		"global": {
			"branches": 90,
			"functions": 90,
			"lines": 90,
			"statements": 90
		},
		"./lib/client/": {
			// TODO: Add unit tests for client code
		}
	},
	testEnvironment: "node"
};
