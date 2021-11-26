const glob = require("fast-glob");
const path = require("path");
const execa = require("execa");
const {promisify} = require("util");
const rimraf = promisify(require("rimraf"));
const ui5Normalizer = require("@ui5/project").normalizer;
const ui5Server = require("@ui5/server").server;
const TEST_TIMEOUT = 5 * 60 * 1000; // 5 minutes
let server;

// Increase test timeout (default 5s)
jest.setTimeout(TEST_TIMEOUT);

const registerIntegrationTest = (configPath) => {
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

		// Pass port of local server to be used in "url" config scenarios
		args.push("--localUI5ServerPort=" + server.port);

		if (process.argv[process.argv.length - 1] === "--useSauceLabs=true") {
			// Enable execution via SauceLabs
			args.push("--useSauceLabs=true");
		}

		// Clean up coverage and FileExport folders
		await rimraf(path.join(path.dirname(fullConfigPath), "coverage"));
		await rimraf(path.join(path.dirname(fullConfigPath), "karma-ui5-reports"));
		await rimraf(path.join(path.dirname(fullConfigPath), "karma-ui5-reports-customized-path"));

		process.stdout.write("\n" + configPath + "\n");

		const karmaProcess = execa("karma", args, {
			cwd: __dirname,
			preferLocal: true, // allow executing local karma binary
			reject: false
		});

		karmaProcess.stdout.pipe(process.stdout);
		karmaProcess.stderr.pipe(process.stderr);

		let processKilled = false;
		const killTimeout = setTimeout(
			() => {
				processKilled = true;
				karmaProcess.kill();
			},
			// Set timeout 1s earlier than jest to ensure that it's reached before.
			// This ensures that the process output is logged in case of a timeout.
			TEST_TIMEOUT - 1000
		);

		const karmaProcessResult = await karmaProcess;

		clearTimeout(killTimeout);

		if (processKilled) {
			throw new Error("Karma execution timed out!");
		}

		if (integrationTest.shouldFail && !karmaProcessResult.failed) {
			throw new Error("Karma execution should have failed!");
		}
		if (!integrationTest.shouldFail && karmaProcessResult.failed) {
			throw new Error("Karma execution should not have failed!");
		}

		if (integrationTest.assertions) {
			integrationTest.assertions({
				expect,
				log: karmaProcessResult.stdout
			});
		}
	});
};

beforeAll(async () => {
	// Start server for sap.ui.core library to be used for integration tests
	// that run against a configured "url"
	const tree = await ui5Normalizer.generateProjectTree({
		cwd: path.dirname(require.resolve("@openui5/sap.ui.core/package.json"))
	});
	server = await ui5Server.serve(tree, {
		port: 5000,
		changePortIfInUse: true
	});
});

afterAll(() => {
	if (server) {
		server.close();
		server = null;
	}
});

describe("Integration Tests", () => {
	const configPaths = glob.sync(["./*/karma*.conf.js"], {cwd: __dirname});
	for (const configPath of configPaths) {
		registerIntegrationTest(configPath);
	}
});
