const normalizer = require("@ui5/project").normalizer;
const ui5Fs = require("@ui5/fs");
const resourceFactory = ui5Fs.resourceFactory;
const ReaderCollectionPrioritized = ui5Fs.ReaderCollectionPrioritized;
const {parse: parseUrl} = require("url");
const http = require("http");
const https = require("https");
const httpProxy = require("http-proxy");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const {Router} = require("express");
const stat = fs.statSync;
const {ErrorMessage} = require("./errors");


class Framework {
	constructor() {
		this.config = {};
	}

	createPluginFilesPattern(pattern) {
		return {pattern, included: true, served: true, watched: false};
	}

	createProjectFilesPattern(pattern) {
		return {pattern, included: false, served: true, watched: true};
	}

	/**
	 * Checks if a list of paths exists
	 *
	 * @private
	 * @param {Array} paths List of paths to check
	 *
	 * @returns {boolean[]} array if path exist
	 */
	pathsExist(paths) {
		return paths.map((folderName) => this.exists(path.join(this.config.basePath, folderName)));
	}

	/**
	 * Checks if a file or path exists
	 *
	 * @private
	 * @param {string} filePath Path to check
	 * @returns {boolean} true if the file or path exists
	 */
	exists(filePath) {
		try {
			return stat(filePath).isDirectory();
		} catch (err) {
			// "File or directory does not exist"
			if (err.code === "ENOENT") {
				return false;
			} else {
				throw err;
			}
		}
	}

	/**
	 * Mutates config and auto set type if not defined
	 */
	detectTypeFromFolder() {
		const webappFolder = this.config.ui5.paths.webapp;
		const srcFolder = this.config.ui5.paths.src;
		const testFolder = this.config.ui5.paths.test;
		const [hasWebapp, hasSrc, hasTest] = this.pathsExist([webappFolder, srcFolder, testFolder]);
		if (hasWebapp) return "application";
		if (hasSrc && hasTest) return "library";
	}

	replaceLast(path, replacement) {
		return path.split("/").slice(0, -1).concat(replacement).join("/");
	}

	checkLegacy(config) {
		if (config.openui5 || config.client.openui5) {
			this.logger.log("error", ErrorMessage.migrateConfig());
			throw new Error(ErrorMessage.failure());
		}
	}

	initScriptMode(config) {
		let url;
		if (config.ui5.url) {
			url = config.ui5.url + "/resources/sap-ui-core.js";
		} else {
			// Uses middleware if no url has been specified
			// Need to use an absolute URL as the file doesn't exist physically but will be
			// resolved via our middleware
			url = `${config.protocol}//${config.hostname}:${config.port}/base/`;
			if (config.ui5.type === "application") {
				url += `${config.ui5.paths.webapp}/resources/sap-ui-core.js`;
			} else if (config.ui5.type === "library") {
				url += `${this.replaceLast(config.ui5.paths.src, "resources")}/sap-ui-core.js`;
			}
		}
		config.client.ui5.config = config.ui5.config;
		config.client.ui5.tests = config.ui5.tests;
		if (config.ui5.tests) {
			config.files.unshift(this.createPluginFilesPattern(`${__dirname}/client/autorun.js`));
		}
		config.files.unshift(this.createPluginFilesPattern(url));
		config.files.unshift(this.createPluginFilesPattern(`${__dirname}/client/sap-ui-config.js`));
	}

	async init({config, logger}) {
		this.config = config;
		this.logger = logger.create("ui5.framework");
		this.config.basePath = config.basePath || "";
		this.config.client = config.client || {};
		this.config.client.clearContext = false;
		// Always override client ui5 config. It should not be used by consumers.
		// Relevant options (e.g. testpage, config, tests) will be written to the client section.
		this.config.client.ui5 = {};
		this.config.client.ui5.useIframe = true; // for now only allow using iframes in HTML mode
		this.config.ui5 = config.ui5 || {};
		this.config.middleware = config.middleware || [];
		this.config.files = config.files || [];
		this.config.beforeMiddleware = config.beforeMiddleware || [];
		this.config.reporters = this.config.reporters || [];

		if (!this.config.ui5.mode) {
			this.config.ui5.mode = "html";
		}
		if (typeof this.config.ui5.failOnEmptyTestPage === "undefined") {
			// TODO 3.0: Enable by default
			this.config.ui5.failOnEmptyTestPage = false;
		}

		this.checkLegacy(config);

		if (this.config.ui5.mode && ["script", "html"].indexOf(this.config.ui5.mode) === -1) {
			this.logger.log("error", ErrorMessage.invalidMode(this.config.ui5.mode));
			throw new Error(ErrorMessage.failure());
		}

		const incompatibleFrameworks = ["qunit", "sinon"];
		const hasIncompatibleFrameworks =
			(frameworks) => frameworks.some((fwk) => incompatibleFrameworks.includes(fwk));
		if (this.config.ui5.mode === "html" && hasIncompatibleFrameworks(this.config.frameworks || [])) {
			this.logger.log("error", ErrorMessage.incompatibleFrameworks(this.config.frameworks) );
			throw new Error(ErrorMessage.failure());
		}

		if (this.config.ui5.mode === "html" && this.config.files.length > 0) {
			this.logger.log("error", ErrorMessage.containsFilesDefinition() );
			throw new Error(ErrorMessage.failure());
		}

		if (this.config.ui5.paths && !this.config.ui5.type) {
			this.logger.log("error", ErrorMessage.customPathWithoutType() );
			throw new Error(ErrorMessage.failure());
		}

		if (this.config.ui5.mode !== "html" && this.config.ui5.urlParameters) {
			this.logger.log("error", ErrorMessage.urlParametersConfigInNonHtmlMode(this.config.ui5.mode,
				this.config.ui5.urlParameters));
			throw new Error(ErrorMessage.failure());
		}

		if (this.config.ui5.urlParameters !== undefined && !Array.isArray(this.config.ui5.urlParameters)) {
			this.logger.log("error", ErrorMessage.urlParametersNotAnArray(this.config.ui5.urlParameters));
			throw new Error(ErrorMessage.failure());
		}

		if (this.config.ui5.urlParameters) {
			this.config.ui5.urlParameters.forEach((urlParameter) => {
				if (typeof urlParameter !== "object") {
					this.logger.log("error", ErrorMessage.urlParameterNotObject(urlParameter));
					throw new Error(ErrorMessage.failure());
				}
				if (urlParameter.key === undefined || urlParameter.value === undefined) {
					this.logger.log("error", ErrorMessage.urlParameterMissingKeyOrValue(urlParameter));
					throw new Error(ErrorMessage.failure());
				}
			});
		}

		if (this.config.ui5.urlParameters !== undefined && !Array.isArray(this.config.ui5.urlParameters)) {
			this.logger.log("error", ErrorMessage.urlParametersNotAnArray(this.config.ui5.urlParameters));
			throw new Error(ErrorMessage.failure());
		}

		if (typeof this.config.ui5.failOnEmptyTestPage !== "boolean") {
			this.logger.log(
				"error",
				ErrorMessage.failOnEmptyTestPageNotTypeBoolean(this.config.ui5.failOnEmptyTestPage)
			);
			throw new Error(ErrorMessage.failure());
		}
		if (this.config.ui5.mode !== "html" && this.config.ui5.failOnEmptyTestPage === true) {
			this.logger.log("error", ErrorMessage.failOnEmptyTestPageInNonHtmlMode(this.config.ui5.mode));
			throw new Error(ErrorMessage.failure());
		}

		if (this.config.reporters.includes("ui5--fileExport")) {
			this.logger.log("error", ErrorMessage.invalidFileExportReporterUsage());
			throw new Error(ErrorMessage.failure());
		}
		if (this.config.ui5.fileExport === true || typeof this.config.ui5.fileExport === "object") {
			this.config.reporters.push("ui5--fileExport");
			if (this.config.ui5.fileExport === true) {
				this.config.ui5.fileExport = {};
			}
		}

		this.config.ui5.paths = this.config.ui5.paths || {
			webapp: "webapp",
			src: "src",
			test: "test"
		};

		["webapp", "src", "test"].forEach((pathName) => {
			let pathValue = this.config.ui5.paths[pathName];
			if (!pathValue) {
				return;
			}

			let absolutePathValue;
			const absoluteBasePath = path.resolve(this.config.basePath);

			// Make sure paths are relative to the basePath
			if (path.isAbsolute(pathValue)) {
				absolutePathValue = pathValue;
				pathValue = path.relative(this.config.basePath, pathValue);
			} else {
				absolutePathValue = path.resolve(this.config.basePath, pathValue);
			}

			// Paths must be within basePath
			if (!absolutePathValue.startsWith(absoluteBasePath)) {
				this.logger.log("error", ErrorMessage.pathNotWithinBasePath({
					pathName,
					pathValue: this.config.ui5.paths[pathName], // use value given in config here
					absolutePathValue,
					basePath: absoluteBasePath
				}));
				throw new Error(ErrorMessage.failure());
			}

			this.config.ui5.paths[pathName] = pathValue;
		});

		this.autoDetectType();

		if (this.config.ui5.mode === "script") {
			this.initScriptMode(config);
		} else {
			// Add browser bundle including third-party dependencies
			this.config.files.unshift(this.createPluginFilesPattern(__dirname + "/../dist/browser-bundle.js"));
		}

		// Make testpage url available to the client
		this.config.client.ui5.testpage = this.config.ui5.testpage;
		// Make failOnEmptyTestPage option available to the client
		this.config.client.ui5.failOnEmptyTestPage = this.config.ui5.failOnEmptyTestPage;
		// Pass configured urlParameters to client
		this.config.client.ui5.urlParameters = this.config.ui5.urlParameters;
		// Pass fileExport parameter to client
		this.config.client.ui5.fileExport = this.config.reporters.includes("ui5--fileExport");


		if (this.config.ui5.type === "application") {
			const webappFolder = this.config.ui5.paths.webapp;
			if (!this.exists(path.join(this.config.basePath, webappFolder))) {
				this.logger.log("error", ErrorMessage.applicationFolderNotFound(webappFolder));
				throw new Error(ErrorMessage.failure());
			}

			// Match all files (including dotfiles)
			this.config.files.push(
				this.createProjectFilesPattern(config.basePath + `/{${webappFolder}/**,${webappFolder}/**/.*}`)
			);
		} else if (config.ui5.type === "library") {
			const srcFolder = this.config.ui5.paths.src;
			const testFolder = this.config.ui5.paths.test;

			const [hasSrc, hasTest] = this.pathsExist([srcFolder, testFolder]);
			if (!hasSrc || !hasTest) {
				this.logger.log("error", ErrorMessage.libraryFolderNotFound({
					srcFolder, testFolder, hasSrc, hasTest
				}));
				throw new Error(ErrorMessage.failure());
			}

			this.config.files.push(
				// Match all files (including dotfiles)
				this.createProjectFilesPattern(`${config.basePath}/{${srcFolder}/**,${srcFolder}/**/.*}`),
				this.createProjectFilesPattern(`${config.basePath}/{${testFolder}/**,${testFolder}/**/.*}`),
			);
		} else {
			this.logger.log("error", ErrorMessage.invalidProjectType(config.ui5.type) );
			throw new Error(ErrorMessage.failure());
		}

		// this.addPreprocessor();
		await this.setupMiddleware();
		return this;
	}

	autoDetectType() {
		if (this.config.ui5.type) {
			return;
		}
		const filePath = path.join(this.config.basePath, "ui5.yaml");
		let fileContent;
		try {
			fileContent = fs.readFileSync(filePath);
		} catch (err) {
			if (err.code !== "ENOENT") {
				throw err;
			}
		}

		if (fileContent) {
			let configs;
			try {
				configs = yaml.loadAll(fileContent, {
					filename: filePath
				});
			} catch (err) {
				if (err.name === "YAMLException") {
					this.logger.log("error", ErrorMessage.invalidUI5Yaml({
						filePath, yamlException: err
					}));
					throw Error(ErrorMessage.failure());
				} else {
					throw err;
				}
			}

			if (!configs[0] || !configs[0].type) {
				this.logger.log("error", ErrorMessage.missingTypeInYaml());
				throw Error(ErrorMessage.failure());
			}

			this.config.ui5.type = configs[0].type;
		} else {
			this.config.ui5.type = this.detectTypeFromFolder();
		}
		if (!this.config.ui5.type) {
			let errorText = "";

			if (this.config.basePath.endsWith("/webapp")) {
				errorText = ErrorMessage.invalidBasePath();
			} else {
				errorText = ErrorMessage.invalidFolderStructure();
			}

			this.logger.log("error", errorText);
			throw new Error(ErrorMessage.failure());
		}
	}

	// Adding coverage preprocessor is currently not supported
	// /**
	//  * Adds preprocessors dynamically in case if no preprocessors have been defined in the config
	//  */
	// addPreprocessor() {
	// 	const type = this.config.ui5.type,
	// 		cwd = process.cwd(),
	// 		srcFolder = this.config.ui5.paths.src,
	// 		webappFolder = this.config.ui5.paths.webapp;

	// 	if (this.config.preprocessors && type && Object.keys(this.config.preprocessors).length === 0) {
	// 		if (type === "library") {
	// 			this.config.preprocessors[`${cwd}/${srcFolder}/**/*.js`] = ['coverage'];
	// 		} else if (type === "application") {
	// 			this.config.preprocessors[`${cwd}/{${webappFolder},${webappFolder}/!(test)}/*.js`] = ['coverage'];
	// 		}
	// 	}
	// }

	/**
	 * Rewrites the given url to use a virtual path that can be resolved
	 * by the UI5 Tooling middleware or to conform with the UI5 CDN.
	 *
	 * Example (application):
	 * /base/webapp/resources/sap-ui-core.js -> /resources/sap-ui-core.js
	 *
	 * Example (library):
	 * /base/src/resources/sap-ui-core.js -> /resources/sap-ui-core.js
	 * /base/test/test-resources/sap-ui-core.js -> /test-resources/sap-ui-core.js
	 *
	 * @param {string} url
	 * @returns {string}
	 */
	rewriteUrl(url) {
		const type = this.config.ui5.type;
		const webappFolder = this.config.ui5.paths.webapp;
		const srcFolder = this.config.ui5.paths.src;
		const testFolder = this.config.ui5.paths.test;
		if (!type) {
			// TODO: do we want no type to be allowed?
			return url;
		} else if (type === "application") {
			const webappPattern = new RegExp(`^/base/${webappFolder}/`);
			if (webappPattern.test(url)) {
				return url.replace(webappPattern, "/");
			}
		} else if (type === "library") {
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
			this.logger.log("error", ErrorMessage.urlRewriteFailed(type));
			return;
		}

		return url;
	}

	/**
	 * Rewrites the given url from a virtual path (resources / test-resources)
	 * to a filesystem path so that the request can be handled by the karma
	 * middleware that serves the project files.
	 *
	 * This is only relevant for type "library", as it has two separate folders (src / test).
	 *
	 * Example:
	 * /base/resources/sap-ui-core.js -> /base/src/sap-ui-core.js
	 * /base/test-resources/sap/ui/test/ -> /base/test/sap/ui/test/
	 *
	 * @param {string} url
	 * @returns {string}
	 */
	rewriteUrlBefore(url) {
		const type = this.config.ui5.type;
		if (type !== "library") {
			// Only rewrite "before" for type library
			return url;
		}
		const srcFolder = this.config.ui5.paths.src;
		const testFolder = this.config.ui5.paths.test;
		const resourcesSrcPattern = new RegExp(
			`/base/${this.replaceLast(srcFolder, "resources")}/`
		);
		const resourcesTestPattern = new RegExp(
			`/base/${this.replaceLast(testFolder, "resources")}/`
		);
		const testResourcesSrcPattern = new RegExp(
			`/base/${this.replaceLast(srcFolder, "test-resources")}/`
		);
		const testResourcesTestPattern = new RegExp(
			`/base/${this.replaceLast(testFolder, "test-resources")}/`
		);
		if (resourcesSrcPattern.test(url)) {
			return url.replace(resourcesSrcPattern, `/base/${srcFolder}/`);
		} else if (resourcesTestPattern.test(url)) {
			return url.replace(resourcesTestPattern, `/base/${srcFolder}/`);
		} else if (testResourcesSrcPattern.test(url)) {
			return url.replace(testResourcesSrcPattern, `/base/${testFolder}/`);
		} else if (testResourcesTestPattern.test(url)) {
			return url.replace(testResourcesTestPattern, `/base/${testFolder}/`);
		}
		return url;
	}

	async setupUI5Server({basePath, configPath}) {
		const normalizerOptions = {
			cwd: basePath
		};
		if (configPath) {
			normalizerOptions.configPath = path.resolve(basePath, configPath);
		}
		const tree = await normalizer.generateProjectTree(normalizerOptions);

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

		const router = new Router();

		// TODO: rework ui5-server API and make public
		const MiddlewareManager = require("@ui5/server/lib/middleware/MiddlewareManager");
		const middlewareManager = new MiddlewareManager({
			tree,
			resources
		});

		await middlewareManager.applyMiddleware(router);

		return router;
	}

	setupProxy({url}) {
		const {protocol} = parseUrl(url);
		const Agent = protocol === "https:" ? https.Agent : http.Agent;
		const agent = new Agent({keepAlive: true});
		const proxy = httpProxy.createProxyServer({
			target: url,
			changeOrigin: true,
			agent
		});
		proxy.on("error", (err, req /* , res*/) => {
			this.logger.warn(`Failed to proxy ${req.url} (${err.code}: ${err.message})`);
		});
		return (req, res) => proxy.web(req, res);
	}

	beforeMiddlewareRewriteUrl(req, res, next) {
		req.url = this.rewriteUrlBefore(req.url);
		next();
	}

	middlewareRewriteUrl(req, res, next) {
		req.url = this.rewriteUrl(req.url);
		next();
	}

	async setupMiddleware() {
		const config = this.config;

		if (config.ui5.type === "library") {
			config.ui5._beforeMiddleware = new Router();
			config.ui5._beforeMiddleware.use(this.beforeMiddlewareRewriteUrl.bind(this));
			config.beforeMiddleware.push("ui5--beforeMiddleware");
		}

		let middleware;
		if (config.ui5.url) {
			middleware = this.setupProxy(config.ui5);
		} else if (config.ui5.useMiddleware !== false) {
			middleware = await this.setupUI5Server({
				basePath: config.basePath,
				configPath: config.ui5.configPath
			});
		}

		if (middleware) {
			config.ui5._middleware = new Router();
			config.ui5._middleware.use(this.middlewareRewriteUrl.bind(this));
			config.ui5._middleware.use(middleware);
			config.middleware.push("ui5--middleware");
		}
	}
}

module.exports = Framework;
