const glob = require("fast-glob");
const path = require("path");
const execa = require("execa");
const {promisify} = require("util");
const writeFile = promisify(require("fs").writeFile);
const rimraf = promisify(require("rimraf"));
const ui5Normalizer = require("@ui5/project").normalizer;
const ui5Server = require("@ui5/server").server;
const createCert = require("create-cert");

const server = {
	http: null,
	https: null
};
const caCertPath = path.join(__dirname, "tmp", "ca.pem");

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

		// Pass port of local servers to be used in "url" config scenarios
		args.push("--localUI5ServerPortHttp=" + server.http.port);
		args.push("--localUI5ServerPortHttps=" + server.https.port);

		// Clean up coverage folder
		await rimraf(path.join(path.dirname(fullConfigPath), "coverage"));

		const karmaProcess = execa("karma", args, {
			cwd: __dirname,
			preferLocal: true, // allow executing local karma binary
			reject: false,
			all: true,
			env: {
				NODE_EXTRA_CA_CERTS: caCertPath
			}
		});

		let processKilled = false;
		const killTimeout = setTimeout(() => {
			processKilled = true;
			karmaProcess.kill();
		}, 9900);

		const karmaProcessResult = await karmaProcess;

		clearTimeout(killTimeout);

		console.log(configPath); // eslint-disable-line no-console
		console.log(karmaProcessResult.all); // eslint-disable-line no-console

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
				log: karmaProcessResult.all
			});
		}
	});
};

// Increase test timeout to 10s (default 5s)
jest.setTimeout(10000);

beforeAll(async (done) => {
	try {
		// Start HTTP / HTTPS servers for sap.ui.core library to be used for integration tests
		// that run against a configured "url"

		const tree = await ui5Normalizer.generateProjectTree({
			cwd: path.dirname(require.resolve("@openui5/sap.ui.core/package.json"))
		});

		server.http = await ui5Server.serve(tree, {
			port: 5000,
			changePortIfInUse: true
		});

		const {key, cert, caCert} = await createCert({
			commonName: "localhost",
			altNames: ["localhost"],
			country: "DE",
		});
		await writeFile(caCertPath, caCert, {encoding: "ascii"});

		server.https = await ui5Server.serve(tree, {
			port: 6000,
			changePortIfInUse: true,
			h2: true, // HTTP/2 also enables HTTPS
			key,
			cert
		});

		done();
	} catch (err) {
		done(err);
	}
});

afterAll(async (done) => {
	try {
		server.http && server.http.close();
		server.http = null;
		server.https && server.https.close();
		server.https = null;
		done();
	} catch (err) {
		done(err);
	}
});

describe("Integration Tests", () => {
	const configPaths = glob.sync(["./*/karma*.conf.js"], {cwd: __dirname});
	// const configPaths = glob.sync(["./application-proxy-https/karma*.conf.js"], {cwd: __dirname});
	for (const configPath of configPaths) {
		registerIntegrationTest(configPath);
	}
});
