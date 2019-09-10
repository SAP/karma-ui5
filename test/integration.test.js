const glob = require("fast-glob");
const path = require("path");
const execa = require("execa");

const registerIntegrationTest = async (configPath) => {
	it(configPath, async () => {
		const fullConfigPath = path.join(__dirname, configPath);
		const integrationTest = require(fullConfigPath);
		const args = [
			"start",
			fullConfigPath
		];
		if (process.argv[process.argv.length - 1] === "--browsers=IE") {
			// Allow switching to IE by passing a CLI arg
			args.push("--browsers=IE");
		}
		if (process.argv[process.argv.length - 1] === "--useSauceLabs=true") {
			// Enable execution via SauceLabs
			args.push("--useSauceLabs=true");
		}
		const karmaProcess = await execa("karma", args, {
			cwd: __dirname,
			preferLocal: true, // allow executing local karma binary
			reject: false
		});

		console.log(configPath); // eslint-disable-line no-console
		console.log(karmaProcess.all); // eslint-disable-line no-console

		if (integrationTest.shouldFail && !karmaProcess.failed) {
			throw new Error("Karma execution should have failed!");
		}
		if (!integrationTest.shouldFail && karmaProcess.failed) {
			throw new Error("Karma execution should not have failed!");
		}

		if (integrationTest.assertions) {
			integrationTest.assertions({
				expect,
				log: karmaProcess.all
			});
		}
	});
};

// Increase test timeout to 300s (default 5s)
jest.setTimeout(300000);

describe("Integration Tests", () => {
	const configPaths = glob.sync(["integration/*/karma*.conf.js"], {cwd: __dirname});
	for (const configPath of configPaths) {
		registerIntegrationTest(configPath);
	}
});
