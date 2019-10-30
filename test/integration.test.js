const glob = require("fast-glob");
const path = require("path");
const execa = require("execa");
const {promisify} = require("util");
const rimraf = promisify(require("rimraf"));
const ui5Normalizer = require("@ui5/project").normalizer;
const ui5Server = require("@ui5/server").server;

// Don't use mocks in integration tests
jest.unmock("@ui5/server");
jest.unmock("@ui5/project");
jest.unmock("@ui5/fs");
jest.unmock("http-proxy");
jest.unmock("js-yaml");

let server;

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

		// Pass port of local server to be used in "url" config scenarios
		args.push("--localUI5ServerPort=" + server.port);

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

beforeAll(async (done) => {
	try {
		// Start server for sap.ui.core library to be used for integration tests
		// that run against a configured "url"
		const tree = await ui5Normalizer.generateProjectTree({
			cwd: path.join(__dirname, "..", "node_modules", "@openui5", "sap.ui.core")
		});
		server = await ui5Server.serve(tree, {
			port: 5000,
			changePortIfInUse: true
		});
		done();
	} catch (err) {
		done(err);
	}
});

afterAll(() => {
	server.close();
});

describe("Integration Tests", () => {
	const configPaths = glob.sync(["integration/*/karma*.conf.js"], {cwd: __dirname});
	for (const configPath of configPaths) {
		registerIntegrationTest(configPath);
	}
});
