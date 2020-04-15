const Router = require("router");
const project = require("./project");
const rewriteUrl = require("./middleware/rewriteUrl");
const karmaConfig = require("./karmaConfig");

class Framework {
	constructor() {
		this.beforeMiddleware = new Router();
		this.middleware = new Router();
		this.initialized = false;
	}

	async init({config, logger, filesPromise}) {
		if (this.initialized) {
			throw new Error("ui5.framework is already initialized!");
		}
		this.initialized = true;

		const log = logger.create("ui5.framework");
		log.debug("Initializing framework...");

		karmaConfig.applyDefaults(config);
		karmaConfig.validate(config, log);

		const projectTree = await project.getProjectTree(config);
		await project.init(config, log, projectTree);

		this.beforeMiddleware.use((req, res, next) => {
			log.debug("beforeMiddleware: " + req.url);
			next();
		});
		this.middleware.use((req, res, next) => {
			log.debug("middleware: " + req.url);
			next();
		});

		if (projectTree && config.ui5.serveFiles !== false) {
			log.debug("Serving project files via @ui5/server middleware");
			// Serve project resources via custom middleware
			// Serve dependencies via UI5 Tooling if no url configured

			const ui5Middleware = require("./middleware/ui5");
			await ui5Middleware.init(this.beforeMiddleware, projectTree, config, filesPromise, {
				serveDependencies: !config.ui5.url // Also serve dependencies when no proxy url is configured
			});
		} else {
			log.debug("Serving project files via karma middleware");
			// Serve project resources via karma
			// Serve dependencies via UI5 Tooling if no url configured

			// Before karma handles the request we need to rewrite the url so that local files can be found
			this.beforeMiddleware.use(rewriteUrl.toFileSystem(config));

			// Before we are handling the request we need to rewrite the url back to a virtual path
			// so that the UI5 server or proxy can find the resources
			this.middleware.use(rewriteUrl.toVirtual(config));

			if (!config.ui5.url) {
				const ui5Middleware = require("./middleware/ui5");
				await ui5Middleware.init2(this.middleware, projectTree);
			}
		}

		// If url is passed, use proxy to load dependencies (after karma or custom resources middleware)
		if (config.ui5.url) {
			const proxyMiddleware = require("./middleware/proxy");
			await proxyMiddleware.init(this.middleware, config.ui5.url);
		}

		if (config.ui5.mode === "script") {
			const scriptMode = require("./mode/script");
			scriptMode.init(config);
		} else {
			const htmlMode = require("./mode/html");
			htmlMode.init(config);
		}

		log.debug("Framework initialized");
	}
}

module.exports = Framework;
