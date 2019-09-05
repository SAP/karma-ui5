const glob = require("fast-glob");
const path = require("path");
const execa = require("execa");
const {promisify} = require("util");
const rimraf = promisify(require("rimraf"));

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

		// Clean up coverage folder
		await rimraf(path.join(path.dirname(fullConfigPath), "coverage"));

		const karmaProcess = await execa("karma", args, {
			cwd: __dirname,
			preferLocal: true, // allow executing local karma binary
			reject: false,
			all: true
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

// Increase test timeout to 10s (default 5s)
jest.setTimeout(10000);

describe("Integration Tests", () => {
	const configPaths = glob.sync(["integration/*/karma*.conf.js"], {cwd: __dirname});
	for (const configPath of configPaths) {
		registerIntegrationTest(configPath);
	}
});
