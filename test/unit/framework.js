const test = require("ava");
const sinon = require("sinon");
const mock = require("mock-require");
const {assertCalls} = require("./__helper__/sinon");

test.beforeEach((t) => {
	const project = require("./../../lib/project");
	const rewriteUrl = require("./../../lib/middleware/rewriteUrl");
	const karmaConfig = require("./../../lib/karmaConfig");
	const proxyMiddleware = require("./../../lib/middleware/proxy");
	const ui5Middleware = require("./../../lib/middleware/ui5");
	const scriptMode = require("./../../lib/mode/script");
	const htmlMode = require("./../../lib/mode/html");

	t.context.log = {
		debug: sinon.stub().named("log.debug"),
		error: sinon.stub().named("log.error")
	};
	t.context.logger = {
		create: sinon.stub().named("logger.create").returns(t.context.log)
	};

	t.context.Router = sinon.stub().named("Router").callsFake(() => {
		return {use: sinon.stub().named("Router#use")};
	});
	mock("router", t.context.Router);

	t.context.project = {
		init: sinon.stub(project, "init")
			.named("project.init")
	};

	t.context.rewriteUrl = {
		toFileSystem: sinon.stub(rewriteUrl, "toFileSystem")
			.named("rewriteUrl.toFileSystem"),
		toVirtual: sinon.stub(rewriteUrl, "toVirtual")
			.named("rewriteUrl.toVirtual")
	};

	t.context.karmaConfig = {
		applyDefaults: sinon.stub(karmaConfig, "applyDefaults")
			.named("karmaConfig.applyDefaults"),
		validate: sinon.stub(karmaConfig, "validate")
			.named("karmaConfig.validate")
	};

	t.context.proxyMiddleware = {
		init: sinon.stub(proxyMiddleware, "init")
			.named("proxyMiddleware.init")
	};
	t.context.ui5Middleware = {
		init: sinon.stub(ui5Middleware, "init")
			.named("ui5Middleware.init")
	};

	t.context.scriptMode = {
		init: sinon.stub(scriptMode, "init")
			.named("scriptMode.init")
	};
	t.context.htmlMode = {
		init: sinon.stub(htmlMode, "init")
			.named("htmlMode.init")
	};

	t.context.Framework = mock.reRequire("../../lib/framework");
});

test.afterEach.always(() => {
	sinon.restore();
});

test.serial("Constructor", async (t) => {
	const {Framework, Router} = t.context;

	const framework = new Framework();

	t.false(framework.initialized, "framework.initialized should be false before calling init");

	t.is(Router.callCount, 2, "new Router() should be called 2 times");

	t.true(Router.getCall(0).calledWithNew(), "Router should be called with new (call 1)");
	t.true(Router.getCall(1).calledWithNew(), "Router should be called with new (call 2)");

	t.deepEqual(Router.getCall(0).args, [], "Router should be called without args (call 1)");
	t.deepEqual(Router.getCall(1).args, [], "Router should be called without args (call 2)");

	t.is(framework.beforeMiddleware, Router.getCall(0).returnValue,
		"framework.beforeMiddleware should be the router returned by call 1");
	t.is(framework.middleware, Router.getCall(1).returnValue,
		"framework.beforeMiddleware should be the router returned by call 2");
});

test.serial("init", async (t) => {
	const {Framework, logger} = t.context;
	const {
		log, karmaConfig, project, rewriteUrl,
		proxyMiddleware, ui5Middleware, scriptMode, htmlMode
	} = t.context;

	const framework = new Framework();

	const config = {ui5: {}};

	const promise = framework.init({config, logger});
	t.true(promise instanceof Promise, "init should return a Promise");

	const returnValue = await promise;
	t.is(returnValue, undefined, "init should resolve with underfined");

	t.true(framework.initialized, "init should set initialized to true");

	// Validate calls
	assertCalls(t, logger.create, ["ui5.framework"]);

	assertCalls(t, log.debug,
		["Initializing framework..."],
		["Framework initialized"]
	);

	assertCalls(t, karmaConfig.applyDefaults, [config]);
	assertCalls(t, karmaConfig.validate, [config, log]);

	assertCalls(t, rewriteUrl.toFileSystem, [config]);
	assertCalls(t, rewriteUrl.toVirtual, [config]);

	assertCalls(t, framework.beforeMiddleware.use,
		[rewriteUrl.toFileSystem.getCall(0).returnValue]
	);
	assertCalls(t, framework.middleware.use,
		[rewriteUrl.toVirtual.getCall(0).returnValue]
	);

	assertCalls(t, project.init,
		{
			args: [config, log, {createTree: true}],
			assert: [t.is, t.is, t.deepEqual] // options object should be compared with deepEqual
		}
	);

	assertCalls(t, proxyMiddleware.init);
	assertCalls(t, ui5Middleware.init, [framework.middleware, project.init.getCall(0).returnValue]);

	assertCalls(t, scriptMode.init);
	assertCalls(t, htmlMode.init, [config]);

	// Validate call order
	sinon.assert.callOrder(
		logger.create,
		log.debug,
		karmaConfig.applyDefaults,
		karmaConfig.validate,
		rewriteUrl.toFileSystem,
		framework.beforeMiddleware.use,
		rewriteUrl.toVirtual,
		framework.middleware.use,
		project.init,
		ui5Middleware.init,
		htmlMode.init,
		log.debug
	);
});
