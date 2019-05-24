const normalizer = require("@ui5/project").normalizer;
const ui5middleware = require("@ui5/server").middleware;
const ui5Fs = require("@ui5/fs");
const resourceFactory = ui5Fs.resourceFactory;
const ReaderCollectionPrioritized = ui5Fs.ReaderCollectionPrioritized;
const httpProxy = require("http-proxy");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const stat = fs.statSync;
const {ErrorMessage} = require("./errors");


class Framework {
	constructor() {
		this.isPaused = true;
		this.queue = [];
		this._serveResources = null;
		this._serveThemes = null;
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

	init({config, logger}) {
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
		this.config.proxies = config.proxies || {};
		this.config.middleware = config.middleware || [];
		this.config.files = config.files || [];
		this.config.beforeMiddleware = config.beforeMiddleware || [];

		if (!this.config.ui5.mode) {
			this.config.ui5.mode = "html";
		}

		this.checkLegacy(config);

		if (this.config.ui5.mode && ["script", "html"].indexOf(this.config.ui5.mode) === -1) {
			this.logger.log("error", ErrorMessage.invalidMode(this.config.ui5.mode));
			throw new Error(ErrorMessage.failure());
		}

		if (config.frameworks && config.frameworks.length > 1 && this.config.ui5.mode === "html") {
			this.logger.log("error", ErrorMessage.multipleFrameworks(config.frameworks) );
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

		this.config.ui5.paths = this.config.ui5.paths || {
			webapp: "webapp",
			src: "src",
			test: "test"
		};

		this.autoDetectType();

		if (this.config.ui5.mode === "script") {
			this.initScriptMode(config);
		} else {
			// Add browser bundle including third-party dependencies
			this.config.files.unshift(this.createPluginFilesPattern(__dirname + "/../dist/browser-bundle.js"));
		}

		// Make testpage url available to the client
		this.config.client.ui5.testpage = this.config.ui5.testpage;


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
			// No proxy required here, local files will be loaded via karma first
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
			// Configure proxies to first load files from karma server (e.g. library under test)
			// Otherwise the coverage reporting won't work
			this.config.proxies[`/base/${this.replaceLast(srcFolder, "resources")}/`] = `/base/${srcFolder}/`;
			this.config.proxies[`/base/${this.replaceLast(srcFolder, "test-resources")}/`] = `/base/${testFolder}/`;
			this.config.proxies[`/base/${this.replaceLast(testFolder, "resources")}/`] = `/base/${srcFolder}/`;
			this.config.proxies[`/base/${this.replaceLast(testFolder, "test-resources")}/`] = `/base/${testFolder}/`;
		} else {
			this.logger.log("error", ErrorMessage.invalidProjectType(config.ui5.type) );
			throw new Error(ErrorMessage.failure());
		}

		// this.addPreprocessor();
		this.setupMiddleware();
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
				configs = yaml.safeLoadAll(fileContent, {
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

	processRequests() {
		this.isPaused = false;
		this.queue.forEach(function(next) {
			next();
		});
		this.queue = [];
	}

	pauseRequests() {
		return (req, res, next) => {
			if (this.isPaused) {
				this.queue.push(next);
			} else {
				next();
			}
		};
	}

	async setupUI5Server(basePath) {
		const tree = await normalizer.generateProjectTree({
			cwd: basePath
		});

		const projectResourceCollections = resourceFactory.createCollectionsForTree(tree);

		const workspace = resourceFactory.createWorkspace({
			reader: projectResourceCollections.source,
			name: tree.metadata.name
		});

		const combo = new ReaderCollectionPrioritized({
			name: "server - prioritize workspace over dependencies",
			readers: [workspace, projectResourceCollections.dependencies]
		});

		const resourceCollections = {
			source: projectResourceCollections.source,
			dependencies: projectResourceCollections.dependencies,
			combo
		};

		return {
			serveResources: ui5middleware.serveResources({resourceCollections}),
			serveThemes: ui5middleware.serveThemes({resourceCollections})
		};
	}

	setupProxy({url}) {
		const proxy = httpProxy.createProxyServer({
			target: url,
			changeOrigin: true
		});

		return {
			serveResources: (req, res, next) => proxy.web(req, res, next),
			serveThemes: undefined
		};
	}

	async setupMiddleware() {
		const config = this.config;

		let server = {
			serveResources: undefined,
			serveThemes: undefined
		};

		if (config.ui5.url) {
			config.middleware.push("ui5--serveResources");
			server = await this.setupProxy(config.ui5);
		} else if (config.ui5.useMiddleware !== false) {
			config.beforeMiddleware.push("ui5--pauseRequests");
			config.middleware.push("ui5--serveResources");
			config.middleware.push("ui5--serveThemes");
			server = await this.setupUI5Server(config.basePath);
		}

		this._serveResources = server.serveResources;
		this._serveThemes = server.serveThemes;
		this.processRequests();
		return this;
	}

	serveResources() {
		return (req, res, next) => {
			req.url = this.rewriteUrl(req.url);
			this._serveResources(req, res, next);
		};
	}

	serveThemes() {
		return (req, res, next) => {
			this._serveThemes(req, res, next);
		};
	}
}

module.exports = Framework;
