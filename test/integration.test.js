const glob = require("fast-glob");
const path = require("path");
const execa = require("execa");

const registerIntegrationTest = async (configPath) => {
	it(configPath, async () => {
		await execa("karma", ["start", path.join(__dirname, configPath)], {
			cwd: __dirname,
			stdio: "inherit",
			preferLocal: true // allow executing local karma binary
		});
	});
};

// Increase test timeout to 10s (default 5s)
jest.setTimeout(10000);

describe("Integration Tests", () => {
	const configPaths = glob.sync(["integration/*/karma*.conf.js"], {cwd: __dirname});
	for (const configPath of configPaths) {
		registerIntegrationTest(configPath);
	}
});
