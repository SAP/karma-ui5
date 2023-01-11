import test from "ava";
import sinonGlobal from "sinon";
import esmock from "esmock";
import {readFileSync} from "node:fs";
import path from "node:path";

test.beforeEach(async (t) => {
	const sinon = t.context.sinon = sinonGlobal.createSandbox();

	t.context.logger = {
		create: function() {
			return {
				type: "",
				message: "",
				log: function(type, message) {
					this.type = type;
					this.message = message;
				},
			};
		}
	};

	const readFileSyncStub = t.context.readFileSyncStub = sinon.stub().callsFake(readFileSync);

	const rootReader = t.context.rootReader = {};
	const rootProject = t.context.rootProject = {
		getName: sinon.stub().returns("sample-app"),
		getReader: sinon.stub().returns(rootReader)
	};
	const dependencyProjectReader = t.context.dependencyProjectReader = {};
	const dependencyProject = t.context.dependencyProject = {
		getName: sinon.stub().returns("dependency-project"),
		getReader: sinon.stub().returns(dependencyProjectReader)
	};
	const graph = t.context.graph = {
		getRoot: sinon.stub().returns(rootProject),
		traverseBreadthFirst: sinon.stub().callsFake(async (cb) => {
			await cb({project: rootProject});
			await cb({project: dependencyProject});
		})
	};

	const graphFromPackageDependencies = t.context.graphFromPackageDependencies = sinon.stub().resolves(graph);
	const createReaderCollection = t.context.createReaderCollection = sinon.stub().returns({});
	const ReaderCollectionPrioritized = t.context.ReaderCollectionPrioritized = sinon.stub().returns({});

	const middlewareManager = t.context.middlewareManager = {
		applyMiddleware: sinon.stub().resolves()
	};
	const MiddlewareManager = t.context.MiddlewareManager = sinon.stub().returns(middlewareManager);

	const Framework = t.context.Framework = await esmock.p("../../../lib/framework.js", {
		"node:fs": {readFileSync: readFileSyncStub},
		"@ui5/project/graph": {graphFromPackageDependencies},
		"@ui5/fs/resourceFactory": {createReaderCollection},
		"@ui5/fs/ReaderCollectionPrioritized": ReaderCollectionPrioritized,
		"@ui5/server/internal/MiddlewareManager": MiddlewareManager
	});

	t.context.framework = new Framework();
	t.context.framework.exists = () => true;
});

test.afterEach.always((t) => {
	t.context.sinon.restore();
	esmock.purge(t.context.Framework);
});

test("Create and apply UI5 Tooling middleware", async (t) => {
	const {
		framework, logger, readFileSyncStub,
		graphFromPackageDependencies, createReaderCollection,
		graph, rootProject, rootReader, dependencyProjectReader,
		ReaderCollectionPrioritized,
		MiddlewareManager, middlewareManager
	} = t.context;

	readFileSyncStub.returns("type: application");

	await framework.init({config: {}, logger});

	t.is(graphFromPackageDependencies.callCount, 1);
	t.deepEqual(graphFromPackageDependencies.getCall(0).args, [{
		cwd: ""
	}]);

	t.is(createReaderCollection.callCount, 1);
	t.deepEqual(createReaderCollection.getCall(0).args, [
		{
			name: "Dependency reader collection for project sample-app",
			readers: [dependencyProjectReader]
		}
	]);
	const dependencies = createReaderCollection.getCall(0).returnValue;

	t.is(ReaderCollectionPrioritized.callCount, 1);
	t.true(ReaderCollectionPrioritized.calledWithNew());
	t.deepEqual(ReaderCollectionPrioritized.getCall(0).args, [
		{
			name: "server - prioritize workspace over dependencies",
			readers: [rootReader, dependencies]
		}
	]);
	const all = ReaderCollectionPrioritized.getCall(0).returnValue;

	t.is(MiddlewareManager.callCount, 1);
	t.true(MiddlewareManager.calledWithNew());
	t.deepEqual(MiddlewareManager.getCall(0).args, [
		{
			graph,
			rootProject,
			resources: {
				rootProject: rootReader,
				dependencies,
				all
			}
		}
	]);

	t.is(middlewareManager.applyMiddleware.callCount, 1);
	t.is(middlewareManager.applyMiddleware.getCall(0).args.length, 1);
	t.is(typeof middlewareManager.applyMiddleware.getCall(0).args[0], "function");
	t.is(middlewareManager.applyMiddleware.getCall(0).args[0].name, "router");
});

test("Create and apply UI5 Tooling middleware (different config path)", async (t) => {
	const {
		framework, logger, readFileSyncStub,
		graphFromPackageDependencies, createReaderCollection,
		graph, rootProject, rootReader, dependencyProjectReader,
		ReaderCollectionPrioritized,
		MiddlewareManager, middlewareManager
	} = t.context;

	readFileSyncStub.returns("type: application");

	await framework.init({config: {
		ui5: {
			configPath: "ui5-karma.yaml"
		}
	}, logger});

	t.is(graphFromPackageDependencies.callCount, 1);
	t.deepEqual(graphFromPackageDependencies.getCall(0).args, [{
		cwd: "",
		rootConfigPath: path.resolve("ui5-karma.yaml")
	}]);

	t.is(createReaderCollection.callCount, 1);
	t.deepEqual(createReaderCollection.getCall(0).args, [
		{
			name: "Dependency reader collection for project sample-app",
			readers: [dependencyProjectReader]
		}
	]);
	const dependencies = createReaderCollection.getCall(0).returnValue;

	t.is(ReaderCollectionPrioritized.callCount, 1);
	t.true(ReaderCollectionPrioritized.calledWithNew());
	t.deepEqual(ReaderCollectionPrioritized.getCall(0).args, [
		{
			name: "server - prioritize workspace over dependencies",
			readers: [rootReader, dependencies]
		}
	]);
	const all = ReaderCollectionPrioritized.getCall(0).returnValue;

	t.is(MiddlewareManager.callCount, 1);
	t.true(MiddlewareManager.calledWithNew());
	t.deepEqual(MiddlewareManager.getCall(0).args, [
		{
			graph,
			rootProject,
			resources: {
				rootProject: rootReader,
				dependencies,
				all
			}
		}
	]);

	t.is(middlewareManager.applyMiddleware.callCount, 1);
	t.is(middlewareManager.applyMiddleware.getCall(0).args.length, 1);
	t.is(typeof middlewareManager.applyMiddleware.getCall(0).args[0], "function");
	t.is(middlewareManager.applyMiddleware.getCall(0).args[0].name, "router");
});
