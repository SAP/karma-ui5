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

	async init({config, logger}) {
		if (this.initialized) {
			throw new Error("ui5.framework is already initialized!");
		}
		this.initialized = true;

		const log = logger.create("ui5.framework");
		log.debug("Initializing framework...");

		karmaConfig.applyDefaults(config);
		karmaConfig.validate(config, log);

		// Before karma handles the request we need to rewrite the url so that local files can be found
		this.beforeMiddleware.use(rewriteUrl.toFileSystem(config));

		// Before we are handling the request we need to rewrite the url back to a virtual path
		// so that the UI5 server or proxy can find the resources
		this.middleware.use(rewriteUrl.toVirtual(config));

		const tree = await project.init(config, log, {
			// Don't create dependency tree when url is provided, as it is not required
			createTree: !config.ui5.url
		});

		if (config.ui5.url) {
			const proxyMiddleware = require("./middleware/proxy");
			await proxyMiddleware.init(this.middleware, config.ui5.url);
		} else {
			const ui5Middleware = require("./middleware/ui5");
			await ui5Middleware.init(this.middleware, tree);
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
