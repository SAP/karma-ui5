const glob = require("fast-glob");
const path = require("path");
const execa = require("execa");

const registerIntegrationTest = async (configPath) => {
	it(configPath, async () => {
		const args = [
			"start",
			path.join(__dirname, configPath)
		];
		if (process.argv[process.argv.length - 1] === "--browsers=IE") {
			// Allow switching to IE by passing a CLI arg
			args.push("--browsers=IE");
		}
		await execa("karma", args, {
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
