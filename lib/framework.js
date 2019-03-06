const normalizer = require("@ui5/project").normalizer;
const {promisify} = require("util");
const ui5middleware = require("@ui5/server").middleware;
const ui5Fs = require("@ui5/fs");
const resourceFactory = ui5Fs.resourceFactory;
const ReaderCollectionPrioritized = ui5Fs.ReaderCollectionPrioritized;
const httpProxy = require("http-proxy");
const fs = require("fs");
const path = require("path");
const parseYaml = require("js-yaml").safeLoadAll;
const stat = fs.statSync;


class Framework {

	constructor() {
		this.isPaused = true;
		this.queue = [];
		this._serveResources = null;
		this._serveThemes = null;
		this.config = {}
	}

	createPluginFilesPattern(pattern) {
		return { pattern, included: true, served: true, watched: false };
	}

	createProjectFilesPattern(pattern){
		return { pattern, included: false, served: true, watched: true };
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
		return paths.map(folderName => this.exists(path.join(this.config.basePath, folderName)));
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
		const webappFolder = this.config.ui5.paths.webapp,
			srcFolder = this.config.ui5.paths.src,
			testFolder = this.config.ui5.paths.test;
		const [hasWebapp, hasSrc, hasTest] = this.pathsExist([webappFolder, srcFolder, testFolder]);
		if(hasWebapp) return "application"
		if(hasSrc && hasTest) return "library";
	}

	replaceLastValueInPath(path, replacement) {
		return path.split("/").slice(0, -1).concat(replacement).join("/")
	}

	checkLegacy(config) {
		if(config.openui5 || config.client.openui5) {
			throw Error("Please migrate your configuration https://github.com/SAP/karma-ui5");
		}
	}

	initWithoutHTMLRunner(config) {
		config.client.ui5.config = config.ui5.config;
		config.client.ui5.tests = config.ui5.tests;
		if(config.ui5.tests) {
			config.files.unshift(this.createPluginFilesPattern(`${__dirname}/client/autorun.js`));
		}
		config.files.unshift(this.createPluginFilesPattern(`${config.ui5.url}/resources/sap-ui-core.js`));
		config.files.unshift(this.createPluginFilesPattern(`${__dirname}/client/sap-ui-config.js`));

	}

	init(config) {
		this.config = config;
		this.config.basePath = config.basePath || "";
		this.config.client = config.client || {};
		this.config.client.clearContext = false;
		this.config.client.ui5 = config.client.ui5 || {};
		this.config.ui5 = config.ui5 || {};
		this.config.proxies = config.proxies || {};
		this.config.middleware = config.middleware || [];
		this.config.files = config.files || [];
		this.config.beforeMiddleware = config.beforeMiddleware || [];
		this.config.ui5.paths = config.ui5.paths || {
			webapp: "webapp",
			src: "src",
			test: "test"
		};

		this.checkLegacy(config);

		if(this.config.ui5.htmlrunner === false) {
			this.initWithoutHTMLRunner(config);
			return this;
		}

		const webappFolder = this.config.ui5.paths.webapp,
			 srcFolder = this.config.ui5.paths.src,
			testFolder = this.config.ui5.paths.test;

		this.autoDetectType();

		// Allow URL override from CLI arg (--ui5-url / --ui5Url)
		if (this.config.ui5Url) {
			this.config.ui5.url = this.config.ui5Url;
		}

		// Make testpage url available to the client
		if (this.config.ui5.testpage || this.config.ui5Testpage) {
			this.config.client.ui5.testpage = this.config.ui5Testpage || this.config.ui5.testpage;
		}

		// Add browser bundle including third-party dependencies
		this.config.files.unshift(this.createPluginFilesPattern(__dirname + "/../dist/browser-bundle.js"));

		if (this.config.ui5.type === "application") {
			// Match all files (including dotfiles)
			this.config.files.push(this.createProjectFilesPattern(config.basePath + `/{${webappFolder}/**,${webappFolder}/**/.*}`));
			// No proxy required here, local files will be loaded via karma first

			// Configure testrunner URL
			this.config.client.ui5.testrunner = `/base/${webappFolder}/test-resources/sap/ui/qunit/testrunner.html`;

		} else if (config.ui5.type === "library") {
			this.config.files.push(
				// Match all files (including dotfiles)
				this.createProjectFilesPattern(`${config.basePath}/{${srcFolder}/**,${srcFolder}/**/.*}`),
				this.createProjectFilesPattern(`${config.basePath}/{${testFolder}/**,${testFolder}/**/.*}`),
			);
			// Configure proxies to first load files from karma server (e.g. library under test)
			// Otherwise the coverage reporting won't work
			this.config.proxies[`/base/${this.replaceLastValueInPath(srcFolder, "resources")}/`] = `/base/${srcFolder}/`;
			this.config.proxies[`/base/${this.replaceLastValueInPath(srcFolder, "test-resources")}/`] = `/base/${testFolder}/`;
			this.config.proxies[`/base/${this.replaceLastValueInPath(testFolder, "resources")}/`] = `/base/${srcFolder}/`;
			this.config.proxies[`/base/${this.replaceLastValueInPath(testFolder, "test-resources")}/`] = `/base/${testFolder}/`;

			// Configure testrunner URL
			this.config.client.ui5.testrunner = `/base/${testFolder}/sap/ui/qunit/testrunner.html`;
		}

		//this.addPreprocessor();
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
			const configs = parseYaml(fileContent, {
				filename: filePath
			});

			if (!configs || configs.length === 0) {
				throw new Error("Could not parse ui5.yaml");
			}

			if (!configs[0].type) {
				throw new Error("Project doesn't have a type configured!");
			}

			this.config.ui5.type = configs[0].type;

		} else {
			this.config.ui5.type = this.detectTypeFromFolder();
		}
	}

	/**
	 * Adds preprocessors dynamically in case if no preprocessors have been defined in the config
	 */
	addPreprocessor() {
		const type = this.config.ui5.type,
			cwd = process.cwd(),
			srcFolder = this.config.ui5.paths.src,
			webappFolder = this.config.ui5.paths.webapp;

		if (this.config.preprocessors && type && Object.keys(this.config.preprocessors).length === 0) {
			if (type === "library") {
				this.config.preprocessors[`${cwd}/${srcFolder}/**/*.js`] = ['coverage'];
			} else if (type === "application") {
				this.config.preprocessors[`${cwd}/{${webappFolder},${webappFolder}/!(test)}/*.js`] = ['coverage'];
			}
		}
	}

	rewriteUrl(url) {
		const type = this.config.ui5.type,
			webappFolder = this.config.ui5.paths.webapp,
			srcFolder = this.config.ui5.paths.src,
			testFolder = this.config.ui5.paths.test;
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
			//const basePattern = /^\/base\//; // TODO: is this expected?
			if (srcPattern.test(url)) {
				return url.replace(srcPattern, "/resources/");
			} else if (testPattern.test(url)) {
				return url.replace(testPattern, "/test-resources/");
			} /*else if (basePattern.test(url)) {
				return url.replace(basePattern, "/");
			}*/
		} else {
			throw new Error(`Failed to rewrite url. Type "${type}" is not supported!`);
		}

		return url;
	}

	processRequests() {
		this.isPaused = false;
		this.queue.forEach(function (next) {
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
			serveResources: ui5middleware.serveResources({ resourceCollections }),
			serveThemes: ui5middleware.serveThemes({ resourceCollections })
		};

	}

	setupProxy({ url }) {
		const proxy = httpProxy.createProxyServer({
			target: url,
			changeOrigin: true
		});

		return {
			serveResources: (req, res, next) => proxy.web(req, res, next),
			serveThemes: undefined
		}
	}

	async setupMiddleware() {

		const config = this.config;

		let server = {
			serveResources: undefined,
			serveThemes: undefined
		};

		if (config.ui5.url) {
			config.middleware.push("qunit-html--serveResources");
			server = await this.setupProxy(config.ui5);
		} else if (config.ui5.useMiddleware !== false) {
			config.beforeMiddleware.push("qunit-html--pauseRequests");
			config.middleware.push("qunit-html--serveResources");
			config.middleware.push("qunit-html--serveThemes");
			server = await this.setupUI5Server(config.basePath);
		}

		this._serveResources = server.serveResources;
		this._serveThemes = server.serveThemes;
		this.processRequests();
		return this;
	}

	serveResources() {
		return (req, res, next) => {
			req.path = req.url = this.rewriteUrl(req.url);
			this._serveResources(req, res, next);
		}
	}

	serveThemes() {
		return (req, res, next) => {
			this._serveThemes(req, res, next);
		}
	}
}

module.exports = Framework;