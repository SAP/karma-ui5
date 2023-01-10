import test from "ava";
import sinonGlobal from "sinon";

import plugin from "../../lib/index.cjs";
import Framework from "../../lib/framework.js";

test.beforeEach(async (t) => {
	t.context.sinon = sinonGlobal.createSandbox();
});

test.afterEach.always((t) => {
	t.context.sinon.restore();
});

test("Exports framework:ui5", (t) => {
	t.true(Array.isArray(plugin["framework:ui5"]));
	t.is(plugin["framework:ui5"].length, 2);
	t.is(plugin["framework:ui5"][0], "factory");
	t.is(typeof plugin["framework:ui5"][1], "function");
	t.deepEqual(plugin["framework:ui5"][1].$inject, ["config", "logger"]);
});

test("Exports middleware:ui5--beforeMiddleware", (t) => {
	t.true(Array.isArray(plugin["middleware:ui5--beforeMiddleware"]));
	t.is(plugin["middleware:ui5--beforeMiddleware"].length, 2);
	t.is(plugin["middleware:ui5--beforeMiddleware"][0], "factory");
	t.is(typeof plugin["middleware:ui5--beforeMiddleware"][1], "function");
	t.deepEqual(plugin["middleware:ui5--beforeMiddleware"][1].$inject, ["config.ui5"]);
});

test("Exports middleware:ui5--middleware", (t) => {
	t.true(Array.isArray(plugin["middleware:ui5--middleware"]));
	t.is(plugin["middleware:ui5--middleware"].length, 2);
	t.is(plugin["middleware:ui5--middleware"][0], "factory");
	t.is(typeof plugin["middleware:ui5--middleware"][1], "function");
	t.deepEqual(plugin["middleware:ui5--middleware"][1].$inject, ["config.ui5"]);
});

test("Exports reporter:ui5--fileExport", (t) => {
	t.true(Array.isArray(plugin["reporter:ui5--fileExport"]));
	t.is(plugin["reporter:ui5--fileExport"].length, 2);
	t.is(plugin["reporter:ui5--fileExport"][0], "factory");
	t.is(typeof plugin["reporter:ui5--fileExport"][1], "function");
	t.deepEqual(plugin["reporter:ui5--fileExport"][1].$inject, ["baseReporterDecorator", "config", "logger"]);
});

test.serial("Initialize framework multiple times", async (t) => {
	const {sinon} = t.context;

	const frameworkInitStub = sinon.stub(Framework.prototype, "init");

	const config1 = {};
	const logger1 = {
		create: sinon.stub().returns({
			log: sinon.stub()
		})
	};

	await plugin["framework:ui5"][1](config1, logger1);

	config1.ui5 = {
		_middleware: sinon.stub(),
		_beforeMiddleware: sinon.stub()
	};

	t.is(frameworkInitStub.callCount, 1);
	t.deepEqual(frameworkInitStub.getCall(0).args, [{config: config1, logger: logger1}]);
	t.is(plugin["middleware:ui5--beforeMiddleware"][1](config1.ui5), config1.ui5._beforeMiddleware);
	t.is(plugin["middleware:ui5--middleware"][1](config1.ui5), config1.ui5._middleware);

	const config2 = {};
	const logger2 = {
		create: sinon.stub().returns({
			log: sinon.stub()
		})
	};

	await plugin["framework:ui5"][1](config2, logger2);

	config2.ui5 = {
		_middleware: sinon.stub(),
		_beforeMiddleware: sinon.stub()
	};

	t.is(frameworkInitStub.callCount, 2);
	t.deepEqual(frameworkInitStub.getCall(1).args, [{config: config2, logger: logger2}]);
	t.is(plugin["middleware:ui5--beforeMiddleware"][1](config2.ui5), config2.ui5._beforeMiddleware);
	t.is(plugin["middleware:ui5--middleware"][1](config2.ui5), config2.ui5._middleware);
});

test.serial("Handle framework initialization error", async (t) => {
	const {sinon} = t.context;

	const frameworkInitError = new Error("Error from framework.init");
	sinon.stub(Framework.prototype, "init").rejects(frameworkInitError);

	const config = {};
	const logger = {
		create: sinon.stub().returns({
			log: sinon.stub()
		})
	};

	await t.throwsAsync(plugin["framework:ui5"][1](config, logger), {
		message: "ui5.framework failed. See error message above"
	});

	t.is(logger.create().log.callCount, 1);
	t.deepEqual(logger.create().log.getCall(0).args, ["error", frameworkInitError.stack]);
});
