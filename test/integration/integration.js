import test from "ava";
import glob from "fast-glob";
import path from "node:path";
import {execa} from "execa";
import {graphFromPackageDependencies} from "@ui5/project/graph";
import {serve} from "@ui5/server";
import {fileURLToPath} from "node:url";
import {createRequire} from "node:module";
import {promisify} from "util";
import rimrafCb from "rimraf";
const rimraf = promisify(rimrafCb);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const TEST_TIMEOUT = 5 * 60 * 1000; // 5 minutes
let server;

const registerIntegrationTest = (configPath) => {
	test.serial(configPath, async (t) => {
		t.timeout(TEST_TIMEOUT);

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
			// Set timeout 1s earlier than ava to ensure that it's reached before.
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
				t,
				log: karmaProcessResult.stdout
			});
		} else {
			t.pass();
		}
	});
};

test.before(async () => {
	// Start server for sap.ui.core library to be used for integration tests
	// that run against a configured "url"
	const graph = await graphFromPackageDependencies({
		cwd: path.dirname(require.resolve("@openui5/sap.ui.core/package.json"))
	});
	server = await serve(graph, {
		port: 5000,
		changePortIfInUse: true
	});
});

test.after(() => {
	if (server) {
		server.close();
		server = null;
	}
});

const configPaths = glob.sync(["./*/karma*.conf.js"], {cwd: __dirname});
// const configPaths = ["application-ui5-tooling/karma-ui5-config-not-found.conf.js"];
for (const configPath of configPaths) {
	registerIntegrationTest(configPath);
}
