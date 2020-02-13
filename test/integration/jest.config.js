module.exports = {
	rootDir: "../../",
	roots: [
		"<rootDir>/lib/",
		"<rootDir>/test/integration/"
	],
	collectCoverageFrom: [
		"<rootDir>/lib/**"
	],
	testEnvironment: "node",
	setupFilesAfterEnv: [
		"jest-extended"
	]
};
