const connect = require("connect");
const normalizer = require("@ui5/project").normalizer;
const middlewareRepository = require("@ui5/server").middlewareRepository;
const ui5Fs = require("@ui5/fs");
const resourceFactory = ui5Fs.resourceFactory;
const ReaderCollectionPrioritized = ui5Fs.ReaderCollectionPrioritized;
const httpProxy = require("http-proxy");

const {replaceLast} = require("./utils");

class Middleware {
	constructor() {
		this.config = {};
		this.logger = null;

		this.isPaused = true;
		this.queue = [];

		this.beforeHandler = connect().use((req, res, next) => {
			this.handleBefore(req, res, next);
		});
		this.handler = connect().use((req, res, next) => {
			this.handleRewriteUrl(req, res, next);
		});
	}

	beforeMiddleware() {
		return this.beforeHandler;
	}
	middleware() {
		return this.handler;
	}

	async init({config, logger}) {
		this.config = config;
		this.logger = logger.create("ui5.framework");
		this.logger.log("debug", "Initializing middleware");

		this.config.beforeMiddleware = this.config.beforeMiddleware || [];
		this.config.middleware = this.config.middleware || [];

		const {ui5, beforeMiddleware, middleware, basePath} = this.config;

		beforeMiddleware.push("ui5--beforeMiddleware");
		middleware.push("ui5--middleware");

		if (ui5.url) {
			this.initProxy(ui5.url);
		} else if (ui5.useMiddleware !== false) { // TODO: remove
			await this.initUI5Middleware(basePath);
		}

		this.processRequests();

		this.logger.log("debug", "Middleware initialized");
	}

	initProxy(url) {
		const proxy = httpProxy.createProxyServer({
			target: url,
			changeOrigin: true
		});

		this.handler.use((req, res, next) => {
			proxy.web(req, res, next);
		});
	}

	async initUI5Middleware(basePath) {
		const tree = await normalizer.generateProjectTree({
			cwd: basePath
		});

		const projectResourceCollections = resourceFactory.createCollectionsForTree(tree);

		const workspace = resourceFactory.createWorkspace({
			reader: projectResourceCollections.source,
			name: tree.metadata.name
		});

		const all = new ReaderCollectionPrioritized({
			name: "server - prioritize workspace over dependencies",
			readers: [workspace, projectResourceCollections.dependencies]
		});

		const resources = {
			rootProject: projectResourceCollections.source,
			dependencies: projectResourceCollections.dependencies,
			all
		};

		this.handler.use(middlewareRepository.getMiddleware("serveResources")({resources}));
		this.handler.use(middlewareRepository.getMiddleware("serveThemes")({resources}));
	}

	handleBefore(req, res, next) {
		this.logger.log("debug", "rewriteUrlBefore from: " + req.url);
		req.url = this.rewriteUrlBefore(req.url);
		this.logger.log("debug", "rewriteUrlBefore to  : " + req.url);
		if (this.isPaused) {
			this.queue.push(next);
		} else {
			next();
		}
	}

	handleRewriteUrl(req, res, next) {
		this.logger.log("debug", "rewriteUrl from: " + req.url);
		req.url = this.rewriteUrl(req.url);
		this.logger.log("debug", "rewriteUrl to  : " + req.url);
		next();
	}

	processRequests() {
		if (!this.isPaused) {
			throw new Error("Requests have already been processed!");
		}
		this.isPaused = false;
		this.queue.forEach(function(next) {
			next();
		});
		this.queue = [];
	}

	rewriteUrl(url) {
		const {type, paths} = this.config.ui5 || {};
		if (!type) {
			// TODO: do we want no type to be allowed?
			return url;
		} else if (type === "application") {
			const webappFolder = paths.webapp;
			const webappPattern = new RegExp(`^/base/${webappFolder}/`);
			if (webappPattern.test(url)) {
				return url.replace(webappPattern, "/");
			}
		} else if (type === "library") {
			const srcFolder = paths.src;
			const testFolder = paths.test;
			const srcPattern = new RegExp(`^/base/${srcFolder}/`);
			const testPattern = new RegExp(`^/base/${testFolder}/`);
			// const basePattern = /^\/base\//; // TODO: is this expected?
			if (srcPattern.test(url)) {
				return url.replace(srcPattern, "/resources/");
			} else if (testPattern.test(url)) {
				return url.replace(testPattern, "/test-resources/");
			} /* else if (basePattern.test(url)) {
				return url.replace(basePattern, "/");
			}*/
		} else {
			// this.logger.log("error", ErrorMessage.urlRewriteFailed(type));
			this.logger.log("error", "TODO");
			return;
		}

		return url;
	}

	rewriteUrlBefore(url) {
		const {type, paths} = this.config.ui5 || {};
		if (!type) {
			// TODO: do we want no type to be allowed?
			return url;
		} else if (type === "application") {
			return url; // no rewrite required
		} else if (type === "library") {
			const srcFolder = paths.src;
			const testFolder = paths.test;

			const srcResourcesPattern = new RegExp(`^/base/${replaceLast(srcFolder, "resources/")}`);
			const srcTestResourcesPattern = new RegExp(`^/base/${replaceLast(srcFolder, "test-resources/")}`);
			const testResourcesPattern = new RegExp(`^/base/${replaceLast(testFolder, "resources/")}`);
			const testTestResourcesPattern = new RegExp(`^/base/${replaceLast(testFolder, "test-resources/")}`);

			if (srcResourcesPattern.test(url)) {
				return url.replace(srcResourcesPattern, `/base/${srcFolder}/`);
			} else if (srcTestResourcesPattern.test(url)) {
				return url.replace(srcTestResourcesPattern, `/base/${testFolder}/`);
			} else if (testResourcesPattern.test(url)) {
				return url.replace(testResourcesPattern, `/base/${srcFolder}/`);
			} else if (testTestResourcesPattern.test(url)) {
				return url.replace(testTestResourcesPattern, `/base/${testFolder}/`);
			}
		} else {
			// this.logger.log("error", ErrorMessage.urlRewriteFailed(type));
			// TODO
			return;
		}

		return url;
	}
}

module.exports = Middleware;
