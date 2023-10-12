import test from "ava";
import sinonGlobal from "sinon";
import esmock from "esmock";
import {readFileSync} from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import {ErrorMessage} from "../../lib/errors.js";

test.beforeEach(async (t) => {
	const sinon = t.context.sinon = sinonGlobal.createSandbox();

	t.context.log = sinon.stub();
	t.context.logger = {
		create: sinon.stub().returns({
			log: t.context.log
		})
	};

	t.context.readFileSyncStub = sinon.stub().callsFake(readFileSync);

	t.context.createProxyServerStub = sinon.stub().returns({
		web: sinon.stub(),
		on: sinon.stub()
	});

	const Framework = t.context.Framework = await esmock("../../lib/framework.js", {
		"node:fs": {
			readFileSync: t.context.readFileSyncStub
		},
		"http-proxy": {
			createProxyServer: t.context.createProxyServerStub
		}
	});
	t.context.framework = new Framework();
	t.context.framework.applyUI5Middleware = sinon.stub().resolves();
});

test.afterEach.always((t) => {
	t.context.sinon.restore();
});

test("Middleware for UI5: Should rewrite url in beforeMiddleware (library only)", async (t) => {
	const {framework, logger, sinon} = t.context;

	const config = {
		ui5: {
			type: "library"
		}
	};
	framework.exists = () => true;
	await framework.init({config, logger});
	t.true(config["middleware"].includes("ui5--middleware"));
	t.true(config["beforeMiddleware"].includes("ui5--beforeMiddleware"));

	const rewriteUrlBeforeSpy = sinon.spy(framework, "rewriteUrlBefore");

	const beforeMiddleware = config.ui5._beforeMiddleware;

	const req = {
		url: "/foo"
	};

	let resolve;
	const middlewarePromise = new Promise((_resolve) => {
		resolve = _resolve;
	});

	beforeMiddleware(req, {}, resolve);
	await middlewarePromise;

	t.is(rewriteUrlBeforeSpy.callCount, 1);
	t.deepEqual(rewriteUrlBeforeSpy.getCall(0).args, ["/foo"]);
	t.is(req.url, "/foo");
});

test("Middleware for UI5: Should rewrite url in middleware", async (t) => {
	const {framework, logger, sinon} = t.context;

	const config = {
		ui5: {
			type: "application"
		}
	};

	framework.exists = () => true;
	await framework.init({config, logger});
	t.true(config["middleware"].includes("ui5--middleware"));

	const rewriteUrlSpy = sinon.spy(framework, "rewriteUrl");

	const middleware = config.ui5._middleware;

	const req = {
		url: "/foo"
	};

	let resolve;
	const middlewarePromise = new Promise((_resolve) => {
		resolve = _resolve;
	});

	middleware(req, {}, resolve);
	await middlewarePromise;

	t.is(rewriteUrlSpy.callCount, 1);
	t.deepEqual(rewriteUrlSpy.getCall(0).args, ["/foo"]);
	t.is(req.url, "/foo");
});

test("Proxy for UI5: Should call proxy module from middleware (http)", (t) => {
	const {framework, createProxyServerStub} = t.context;

	const proxyServer = framework.setupProxy({
		url: "http://localhost"
	});

	t.is(createProxyServerStub.lastCall.args.length, 1);
	t.deepEqual(Object.keys(createProxyServerStub.lastCall.args[0]), ["target", "changeOrigin", "agent"]);
	t.is(createProxyServerStub.lastCall.args[0].target, "http://localhost");
	t.is(createProxyServerStub.lastCall.args[0].changeOrigin, true);
	t.true(createProxyServerStub.lastCall.args[0].agent instanceof http.Agent);
	t.is(createProxyServerStub.lastCall.args[0].agent.keepAlive, true);
	t.is(createProxyServerStub.lastCall.args[0].agent.protocol, "http:");

	const proxy = createProxyServerStub.lastCall.returnValue;

	t.is(proxy.on.lastCall.args.length, 2);
	t.is(proxy.on.lastCall.args[0], "error");
	t.is(typeof proxy.on.lastCall.args[1], "function");

	const req = {};
	const res = {};
	proxyServer(req, res);

	t.deepEqual(proxy.web.lastCall.args, [req, res]);
});

test("Proxy for UI5: Should call proxy module from middleware (https)", (t) => {
	const {framework, createProxyServerStub} = t.context;

	const proxyServer = framework.setupProxy({
		url: "https://localhost"
	});

	t.is(createProxyServerStub.lastCall.args.length, 1);
	t.deepEqual(Object.keys(createProxyServerStub.lastCall.args[0]), ["target", "changeOrigin", "agent"]);
	t.is(createProxyServerStub.lastCall.args[0].target, "https://localhost");
	t.is(createProxyServerStub.lastCall.args[0].changeOrigin, true);
	t.true(createProxyServerStub.lastCall.args[0].agent instanceof https.Agent);
	t.is(createProxyServerStub.lastCall.args[0].agent.keepAlive, true);
	t.is(createProxyServerStub.lastCall.args[0].agent.protocol, "https:");

	const proxy = createProxyServerStub.lastCall.returnValue;

	t.is(proxy.on.lastCall.args.length, 2);
	t.is(proxy.on.lastCall.args[0], "error");
	t.is(typeof proxy.on.lastCall.args[1], "function");

	const req = {};
	const res = {};
	proxyServer(req, res);

	t.deepEqual(proxy.web.lastCall.args, [req, res]);
});

test("UI5 Middleware / Proxy configuration: Should setup proxy middleware when url is configured", async (t) => {
	const {framework, logger, sinon} = t.context;

	framework.exists = () => true;
	const setupProxySpy = sinon.spy(framework, "setupProxy");
	const config = {
		ui5: {
			url: "http://localhost",
			type: "application"
		}
	};

	await framework.init({config, logger});

	t.is(setupProxySpy.callCount, 1);
	t.is(setupProxySpy.getCall(0).args.length, 1);
	t.deepEqual(Object.keys(setupProxySpy.getCall(0).args[0]), [
		"url",
		"type",
		"mode",
		"failOnEmptyTestPage",
		"paths",
		"_middleware"
	]);
	t.is(setupProxySpy.getCall(0).args[0].url, "http://localhost");
	t.is(setupProxySpy.getCall(0).args[0].type, "application");
	t.is(setupProxySpy.getCall(0).args[0].mode, "html");
	t.is(setupProxySpy.getCall(0).args[0].failOnEmptyTestPage, false);
	t.deepEqual(setupProxySpy.getCall(0).args[0].paths, {
		webapp: "webapp",
		src: "src",
		test: "test"
	});
	t.is(typeof setupProxySpy.getCall(0).args[0]._middleware, "function");
});

test("UI5 Middleware / Proxy configuration: Should setup UI5 tooling middleware if ui5.yaml is present",
	async (t) => {
		const {framework, logger, sinon} = t.context;

		framework.exists = () => true;
		const setupUI5Server = sinon.spy(framework, "setupUI5Server");

		framework.init({config: {}, logger});

		t.deepEqual(setupUI5Server.lastCall.args, [{basePath: "", configPath: undefined}]);
	});

test("ui5.yaml: should be configurable when autoDetectType",
	async (t) => {
		const {framework, logger, readFileSyncStub, sinon} = t.context;
		const autoDetectTypeSpy = sinon.spy(framework, "autoDetectType");
		const mockUI5YamlPath = "/alternative/ui5/yaml/ui5-custom.yaml";

		framework.exists = () => true;
		framework.init({config: {ui5: {configPath: mockUI5YamlPath}}, logger});

		t.true(autoDetectTypeSpy.calledOnce, "autoDetectType is called");
		t.deepEqual(readFileSyncStub.lastCall.args, [path.resolve(mockUI5YamlPath)],
			"Custom ui5.yaml is provided");
	});

// Sad path
test("UI5 Middleware / Proxy configuration: Should throw if ui5.yaml is missing and no url is configured",
	async (t) => {
		const {framework, logger} = t.context;
		await t.throwsAsync(framework.init({config: {}, logger}), {
			message: "ui5.framework failed. See error message above"
		});
	});

test("ui5.paths handling: application: Should resolve relative path relative to basePath", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			url: "http://localhost",
			type: "application",
			paths: {
				webapp: "webapp-path"
			}
		}
	};

	framework.exists = (filePath) => {
		return filePath === "webapp-path";
	};

	await framework.init({config, logger});

	t.deepEqual(config.ui5.paths, {
		webapp: "webapp-path"
	});
});
test("ui5.paths handling: application: Should resolve absolute path relative to basePath", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			url: "http://localhost",
			type: "application",
			paths: {
				webapp: path.resolve("webapp-path")
			}
		}
	};

	framework.exists = (filePath) => {
		return filePath === "webapp-path";
	};

	await framework.init({config, logger});

	t.deepEqual(config.ui5.paths, {
		webapp: "webapp-path"
	});
});

test("ui5.paths handling: library: Should resolve relative paths relative to basePath", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			url: "http://localhost",
			type: "library",
			paths: {
				src: "src-path",
				test: "test-path"
			}
		}
	};

	framework.exists = (filePath) => {
		return filePath === "src-path" || filePath === "test-path";
	};

	await framework.init({config, logger});

	t.deepEqual(config.ui5.paths, {
		src: "src-path",
		test: "test-path"
	});
});
test("ui5.paths handling: library: Should resolve absolute paths relative to basePath", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			url: "http://localhost",
			type: "library",
			paths: {
				src: path.resolve("src-path"),
				test: path.resolve("test-path")
			}
		}
	};

	framework.exists = (filePath) => {
		return filePath === "src-path" || filePath === "test-path";
	};

	await framework.init({config, logger});

	t.deepEqual(config.ui5.paths, {
		src: "src-path",
		test: "test-path"
	});
});

test("ui5.paths handling: application: Should throw error when absolute path is not within basePath", async (t) => {
	const {framework, logger, log} = t.context;

	const basePath = path.resolve("/", "test", "bar");
	const pathValue = path.resolve("/", "test", "foo", "webapp-path");
	const config = {
		basePath,
		ui5: {
			url: "http://localhost",
			type: "application",
			paths: {
				webapp: pathValue
			}
		}
	};

	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});

	t.deepEqual(log.getCall(0).args, ["error", ErrorMessage.pathNotWithinBasePath({
		pathName: "webapp",
		pathValue,
		absolutePathValue: pathValue,
		basePath
	})]);
});
test("ui5.paths handling: application: Should throw error when relative path is not within basePath", async (t) => {
	const {framework, logger, log} = t.context;

	const basePath = path.resolve("/", "test", "bar");
	const pathValue = "../foo/webapp-path";
	const config = {
		basePath,
		ui5: {
			url: "http://localhost",
			type: "application",
			paths: {
				webapp: pathValue
			}
		}
	};

	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});

	t.deepEqual(log.getCall(0).args, ["error", ErrorMessage.pathNotWithinBasePath({
		pathName: "webapp",
		pathValue,
		absolutePathValue: path.resolve(basePath, "..", "foo", "webapp-path"),
		basePath
	})]);
});

test("Plugin setup: Should include browser bundle", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {useMiddleware: false}
	};

	framework.exists = () => true;
	await framework.init({config, logger});
	t.true(config.files[0].pattern.includes("browser-bundle.js"));
	t.is(config.files[0].included, true);
	t.is(config.files[0].served, true);
	t.is(config.files[0].watched, false);
});

test("Should auto-detect application project from ui5.yaml", async (t) => {
	const {framework, logger, readFileSyncStub} = t.context;

	readFileSyncStub.callsFake(function(filePath) {
		if (filePath === "ui5.yaml") {
			return "---\ntype: application\n";
		}
	});

	const config = {};

	framework.exists = () => true;
	await framework.init({config, logger});

	t.is(config.ui5.type, "application");
});

test("Should auto-detect library project from ui5.yaml", async (t) => {
	const {framework, logger, readFileSyncStub} = t.context;

	readFileSyncStub.callsFake(function(filePath) {
		if (filePath === "ui5.yaml") {
			return "---\ntype: library\n";
		}
	});

	const config = {};

	framework.exists = () => true;
	await framework.init({config, logger});

	t.is(config.ui5.type, "library");
});

test("Types configuration: application: Should serve and watch webapp folder", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			useMiddleware: false,
			type: "application"
		}
	};

	framework.exists = () => true;
	await framework.init({config, logger});

	const fileConfig = config.files.find((file) => file.pattern.endsWith("/{webapp/**,webapp/**/.*}"));

	t.is(fileConfig.included, false);
	t.is(fileConfig.served, true);
	t.is(fileConfig.watched, true);
});

test("Types configuration: library: Should modify config file for libraries", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			useMiddleware: false,
			type: "library"
		}
	};


	framework.exists = () => true;
	await framework.init({config, logger});
	t.truthy(config.files.find((file) => file.pattern.endsWith("/{src/**,src/**/.*}")));
	t.truthy(config.files.find((file) => file.pattern.endsWith("/{test/**,test/**/.*}")));
});

// TODO: What should happen?
test("no type", async (t) => {
	const {framework, logger} = t.context;

	const config = {};

	framework.exists = () => true;
	await framework.init({config, logger});
	t.pass();
});

test("Testpage: Configured testpage should be passed to client config", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			testpage: "foo"
		}
	};

	framework.exists = () => true;
	framework.init({
		config: config,
		logger: logger
	});

	t.is(config.client.ui5.testpage, "foo");
});

test("urlParameters: Configured URL parameters should be passed to client config", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			urlParameters: [
				{
					key: "test",
					value: "🦆"
				},
				{
					key: 0,
					value: "🐴"
				}
			]
		}
	};

	framework.exists = () => true;
	framework.init({
		config: config,
		logger: logger
	});

	t.deepEqual(config.client.ui5.urlParameters, [{
		key: "test",
		value: "🦆"
	}, {
		key: 0,
		value: "🐴"
	}]);
});

test("failOnEmptyTestPage: should default to 'false'", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {}
	};

	framework.exists = () => true;
	framework.init({
		config: config,
		logger: logger
	});

	t.is(config.ui5.failOnEmptyTestPage, false);
});
test("failOnEmptyTestPage: should pass 'true' value to client", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			failOnEmptyTestPage: true
		}
	};

	framework.exists = () => true;
	framework.init({
		config: config,
		logger: logger
	});

	t.is(config.client.ui5.failOnEmptyTestPage, true);
});
test("failOnEmptyTestPage: should pass 'false' value to client", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			failOnEmptyTestPage: false
		}
	};

	framework.exists = () => true;
	framework.init({
		config: config,
		logger: logger
	});

	t.is(config.client.ui5.failOnEmptyTestPage, false);
});
test("failOnEmptyTestPage: Should throw if failOnEmptyTestPage is not of type boolean (string)", async (t) => {
	const {framework, logger, log} = t.context;

	const config = {
		ui5: {failOnEmptyTestPage: "true"}
	};

	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.deepEqual(log.getCall(0).args, ["error", ErrorMessage.failOnEmptyTestPageNotTypeBoolean("true")]);
});
test("failOnEmptyTestPage: Should throw if failOnEmptyTestPage is not of type boolean (object)", async (t) => {
	const {framework, logger, log} = t.context;

	const config = {
		ui5: {failOnEmptyTestPage: {foo: "bar"}}
	};

	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.deepEqual(log.getCall(0).args, ["error", ErrorMessage.failOnEmptyTestPageNotTypeBoolean({foo: "bar"})]);
});
test("failOnEmptyTestPage: Should throw if failOnEmptyTestPage is used with script mode", async (t) => {
	const {framework, logger, log} = t.context;

	const config = {
		ui5: {mode: "script", failOnEmptyTestPage: true}
	};

	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.deepEqual(log.getCall(0).args, ["error", ErrorMessage.failOnEmptyTestPageInNonHtmlMode("script")]);
});

test("Without QUnit HTML Runner (with URL): Should include sap-ui-config.js and sap-ui-core.js", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			mode: "script",
			url: "https://example.com"
		}
	};

	framework.exists = () => true;
	await framework.init({config, logger});
	t.true(config.files[0].pattern.includes("lib/client/sap-ui-config.js"));
	t.is(config.files[1].pattern, "https://example.com/resources/sap-ui-core.js");
});

test("Without QUnit HTML Runner (with URL): " +
"Should include also include autorun.js if tests are configured", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			mode: "script",
			url: "https://example.com",
			tests: ["some/test"]
		}
	};

	framework.exists = () => true;
	await framework.init({config, logger});
	t.true(config.files[0].pattern.includes("lib/client/sap-ui-config.js"));
	t.is(config.files[1].pattern, "https://example.com/resources/sap-ui-core.js");
	t.true(config.files[2].pattern.includes("lib/client/autorun.js"));
});

test("Without QUnit HTML Runner (without URL): " +
"application: Should include sap-ui-config.js and sap-ui-core.js",
async (t) => {
	const {framework, logger} = t.context;

	const config = {

		protocol: "http:",
		port: "1234",
		hostname: "foo",

		ui5: {
			mode: "script",
			type: "application"
		}
	};

	framework.exists = () => true;
	await framework.init({config, logger});
	t.true(config.files[0].pattern.includes("lib/client/sap-ui-config.js"));
	t.is(config.files[1].pattern, "http://foo:1234/base/webapp/resources/sap-ui-core.js");
});

test("Without QUnit HTML Runner (without URL): " +
"application (custom path): Should include sap-ui-config.js and sap-ui-core.js", async (t) => {
	const {framework, logger} = t.context;

	const config = {

		protocol: "http:",
		port: "1234",
		hostname: "foo",

		ui5: {
			mode: "script",
			type: "application",
			paths: {
				webapp: "src/main/webapp"
			}
		}
	};

	framework.exists = () => true;
	await framework.init({config, logger});
	t.true(config.files[0].pattern.includes("lib/client/sap-ui-config.js"));
	t.is(config.files[1].pattern, "http://foo:1234/base/src/main/webapp/resources/sap-ui-core.js");
});

test("Without QUnit HTML Runner (without URL): " +
"library (custom paths): Should include sap-ui-config.js and sap-ui-core.js", async (t) => {
	const {framework, logger} = t.context;

	const config = {

		protocol: "http:",
		port: "1234",
		hostname: "foo",

		ui5: {
			mode: "script",
			type: "library",
			paths: {
				src: "src/main/js",
				test: "src/test/js"
			}
		}
	};

	framework.exists = () => true;
	await framework.init({config, logger});
	t.true(config.files[0].pattern.includes("lib/client/sap-ui-config.js"));
	t.is(config.files[1].pattern, "http://foo:1234/base/src/main/resources/sap-ui-core.js");
});

test("Execution mode: Should implicitly set useIframe to true", async (t) => {
	const {framework, logger} = t.context;

	const config = {};

	framework.exists = () => true;
	await framework.init({config, logger});
	t.is(framework.config.client.ui5.useIframe, true);
});

test("Execution mode: Should not overwrite useIframe default (currently not supported)", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		client: {
			ui5: {
				useIframe: false
			}
		}
	};

	framework.exists = () => true;
	await framework.init({config, logger});
	t.is(framework.config.client.ui5.useIframe, true);
});


test("FileExportReporter settings: Should enable fileExport via object", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			fileExport: {
				foo: "bar"
			}
		}
	};
	framework.exists = () => true;
	await framework.init({config, logger});

	t.deepEqual(config.ui5.fileExport, {foo: "bar"});
	t.is(config.client.ui5.fileExport, true);
	t.deepEqual(config.reporters, ["ui5--fileExport"]);
});

test("FileExportReporter settings: Should enable fileExport via boolean", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			fileExport: true
		}
	};
	framework.exists = () => true;
	await framework.init({config, logger});

	t.deepEqual(config.ui5.fileExport, {});
	t.is(config.client.ui5.fileExport, true);
	t.deepEqual(config.reporters, ["ui5--fileExport"]);
});

test("FileExportReporter settings: Should not enable fileExport (negative test cases)", async (t) => {
	const {framework, logger} = t.context;

	framework.exists = () => true;

	const ui5ConfigsWithDisabledFileExport = [
		{},
		{fileExport: false},
		{fileExport: "foo"},
		{fileExport: undefined}
	];

	ui5ConfigsWithDisabledFileExport.forEach((ui5Config) => {
		const config = {
			ui5: ui5Config
		};
		framework.init({config, logger});

		t.deepEqual(config.ui5, ui5Config);
		t.is(config.client.ui5.fileExport, false);
		t.deepEqual(config.reporters, []);
	});
});

test("FileExportReporter settings: " +
"Should throw error if fileExport reporter was already set in list of reporters", async (t) => {
	const {framework, logger, log} = t.context;

	framework.exists = () => true;

	const config = {
		reporters: ["ui5--fileExport"]
	};

	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.deepEqual(log.getCall(0).args, ["error", ErrorMessage.invalidFileExportReporterUsage()]);
});

// TODO: add test to check for client.clearContext
