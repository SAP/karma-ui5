const normalizer = require("@ui5/project").normalizer;
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
			throw Error("Please migrate your configuration https://github.com/SAP/karma-ui5");
		}
	}

	initWithoutHTMLRunner(config) {
		config.client.ui5.config = config.ui5.config;
		config.client.ui5.tests = config.ui5.tests;
		if (config.ui5.tests) {
			config.files.unshift(this.createPluginFilesPattern(`${__dirname}/client/autorun.js`));
		}
		config.files.unshift(this.createPluginFilesPattern(`${config.ui5.url}/resources/sap-ui-core.js`));
		config.files.unshift(this.createPluginFilesPattern(`${__dirname}/client/sap-ui-config.js`));
	}

	init({config, logger}) {
		this.config = config;
		this.logger = logger.create("ui5.framework");
		this.config.basePath = config.basePath || "";
		this.config.client = config.client || {};
		this.config.client.clearContext = false;
		this.config.client.ui5 = config.client.ui5 || {};
		this.config.ui5 = config.ui5 || {};
		this.config.proxies = config.proxies || {};
		this.config.middleware = config.middleware || [];
		this.config.files = config.files || [];
		this.config.beforeMiddleware = config.beforeMiddleware || [];

		if (this.config.client.ui5.useIframe !== false) {
			this.config.client.ui5.useIframe = true;
		}

		this.checkLegacy(config);

		if (this.config.ui5.htmlrunner === false) {
			this.initWithoutHTMLRunner(config);
			return this;
		}

		if (config.frameworks && config.frameworks.length > 1) {
			let errorText = "\nThe \"karma-ui5\" plugin is not compatible with other framework plugins " +
				"such as \"qunit\" when running in \"html\" mode.";
			if (config.frameworks.includes("qunit")) {
				errorText += "\nQUnit is supported out of the box.";
			}
			if (config.frameworks.includes("sinon")) {
				errorText += "\nSinon should be loaded from the test.";
			}
			errorText += `

Please make sure to define "ui5" as the only framework in your karma config:

module.exports = function(config) {
	config.set({

		frameworks: ["ui5"],

	});
};
`;
			this.logger.log("error", errorText);
			throw new Error("ui5.framework failed. See error message above");
		}

		if (Object.keys(config.files).length !== 0) {
			const errorText = "\nThe \"karma-ui5\" plugin automatically sets the \"files\" config " +
				"when running in \"html\" mode.\n" +
				"There is no need to manually define file patterns." + `

Please make sure to remove defined "files" in your karma config:

module.exports = function(config) {
	config.set({

		files: {
			{ ... }
		}

	});
};
`;
			this.logger.log("error", errorText);
			throw new Error("ui5.framework failed. See error message above");
		}

		if (this.config.ui5.paths && !this.config.ui5.type) {
			const errorText = `\nCustom "paths" have been defined but a "type" is missing

Please add a type (application or library) to your configuration

module.exports = function(config) {
	config.set({

		ui5: {
			type: "application|library"
		}

	});
};
`;
			this.logger.log("error", errorText);
			throw new Error("ui5.framework failed. See error message above");
		}

		this.config.ui5.paths = this.config.ui5.paths || {};

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
			const webappFolder = this.config.ui5.paths.webapp || "webapp";

			if (!this.exists(path.join(this.config.basePath, webappFolder))) {
				const errorText = `\nCould not find defined path to your "webapp" folder.

Please check if the configured path is correct:

module.exports = function(config) {
	config.set({

		ui5: {
			type: "application",
			paths: {
				webapp: "${webappFolder}" \t<-- Not found
			}
		}

	});
};
`;
				this.logger.log("error", errorText);
				throw new Error("ui5.framework failed. See error message above");
			}

			// Match all files (including dotfiles)
			this.config.files.push(
				this.createProjectFilesPattern(config.basePath + `/{${webappFolder}/**,${webappFolder}/**/.*}`)
			);
			// No proxy required here, local files will be loaded via karma first
		} else if (config.ui5.type === "library") {
			const srcFolder = this.config.ui5.paths.src || "src";
			const testFolder = this.config.ui5.paths.test || "test";

			const [hasSrc, hasTest] = this.pathsExist([srcFolder, testFolder]);
			if (!hasSrc || !hasTest) {
				const errorText = `\nCould not find defined paths to your "src" / "test" folders.

Please check if the configured paths are correct:

module.exports = function(config) {
	config.set({

		ui5: {
			type: "library",
			paths: {
				src: "${srcFolder}" ${!hasSrc ? "\t<-- Not found" : ""}
				test: "${testFolder}" ${!hasTest ? "\t<-- Not found" : ""}
			}
		}

	});
};
`;
				this.logger.log("error", errorText);
				throw new Error("ui5.framework failed. See error message above");
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
			const errorText = `\nInvalid project type defined.

Valid types: "application" / "library"

module.exports = function(config) {
	config.set({

		ui5: {
			type: "${config.ui5.type}"
		}

	});
};
`;
			this.logger.log("error", errorText);
			throw new Error("ui5.framework failed. See error message above");
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
			const configs = parseYaml(fileContent, {
				filename: filePath
			});

			if (!configs || configs.length === 0) {
				this.logger.log("error", [
					`Could not parse ui5.yaml. Please make sure that the ui5.yaml has a valid format.
					For reference check:
					https://github.com/SAP/ui5-project/blob/master/docs/Configuration.md#configuration`
				]);
				return;
			}

			if (!configs[0].type) {
				this.logger.log("error", [
					`Project doesn't have a type configured. Please make sure that the ui5.yaml has a type declared.\n
					 For reference check:
					 https://github.com/SAP/ui5-project/blob/master/docs/Configuration.md#configuration`
				]);
				return;
			}

			this.config.ui5.type = configs[0].type;
		} else {
			this.config.ui5.type = this.detectTypeFromFolder();
		}
		if (!this.config.ui5.type) {
			let errorText = "\nProject type could not be detected.";

			if (this.config.basePath.endsWith("/webapp")) {
				errorText += `It seems that your "basePath" points to the "webapp" folder of your project.

Please make sure that the "basePath" points to your project root.
If your karma.conf.js is in your project root, you can omit the "basePath" or set it to an empty string.

module.exports = function(config) {
	config.set({

		basePath: "",

	});
};
`;
			} else {
				errorText += `Your project seems to have an unknown folder structure, so a type could not be detected.
Please make sure to configure a "type" and the paths to your folders.

For type "application", a path to your "webapp" folder needs to be defined:

module.exports = function(config) {
	config.set({

		ui5: {
			type: "application",
			paths: {
				webapp: "path/to/webapp"
			}
		}

	});
};

For type "library", paths to your "src" and "test" folders need to be defined:

module.exports = function(config) {
	config.set({

		ui5: {
			type: "library",
			paths: {
				src: "path/to/src"
				test: "path/to/test"
			}
		}

	});
};
`;
			}

			this.logger.log("error", errorText);
			throw new Error("ui5.framework failed. See error message above");
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
			this.logger.log("error", [
				`Failed to rewrite url. Type "${type}" is not supported.
				 Please use "library" or "application" as type.`]);
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
			req.path = req.url = this.rewriteUrl(req.url);
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
