const path = require("path");
const {ErrorMessage} = require("./errors");
const {exists, pathsExist} = require("./utils");
const {Router: expressRouter} = require("express");
const rewriteUrl = require("./middleware/rewriteUrl");

class Framework {
	constructor() {
		this.config = {};
		this.beforeMiddleware = expressRouter();
		this.middleware = expressRouter();
	}

	applyDefaults(config) {
		this.config.basePath = config.basePath || "";
		this.config.client = config.client || {};
		this.config.client.clearContext = false;
		// Always override client ui5 config. It should not be used by consumers.
		// Relevant options (e.g. testpage, config, tests) will be written to the client section.
		this.config.client.ui5 = {};
		this.config.client.ui5.useIframe = true; // for now only allow using iframes in HTML mode
		this.config.ui5 = config.ui5 || {};
		this.config.files = config.files || [];

		if (!this.config.ui5.mode) {
			this.config.ui5.mode = "html";
		}

		this.config.beforeMiddleware = this.config.beforeMiddleware || [];
		this.config.middleware = this.config.middleware || [];

		config.beforeMiddleware.push("ui5--beforeMiddleware");
		config.middleware.push("ui5--middleware");
	}

	detectTypeFromFolder() {
		const webappFolder = this.config.ui5.paths.webapp;
		const srcFolder = this.config.ui5.paths.src;
		const testFolder = this.config.ui5.paths.test;
		const [hasWebapp, hasSrc, hasTest] = pathsExist(this.config.basePath, [webappFolder, srcFolder, testFolder]);
		if (hasWebapp) return "application";
		if (hasSrc && hasTest) return "library";
	}

	validateConfig(config) {
		// Check for legacy karma-openui5 settings
		if (config.openui5 || config.client.openui5) {
			this.logger.log("error", ErrorMessage.migrateConfig());
			throw new Error(ErrorMessage.failure());
		}

		if (this.config.ui5.mode && ["script", "html"].indexOf(this.config.ui5.mode) === -1) {
			this.logger.log("error", ErrorMessage.invalidMode(this.config.ui5.mode));
			throw new Error(ErrorMessage.failure());
		}

		const blacklistedFrameworks = ["qunit", "sinon"];
		const hasBlacklistedFrameworks = (frameworks) => frameworks.some((fwk) => blacklistedFrameworks.includes(fwk));
		if (this.config.ui5.mode === "html" && hasBlacklistedFrameworks(this.config.frameworks || [])) {
			this.logger.log("error", ErrorMessage.blacklistedFrameworks(this.config.frameworks) );
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
	}

	checkPaths() {
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
	}

	async _getProjectTree() {
		const normalizerOptions = {
			cwd: this.config.basePath
		};
		// const {normalizer, projectPreprocessor} = require("@ui5/project");
		// const tree = await normalizer.generateDependencyTree(normalizerOptions);

		// if (normalizerOptions.configPath) {
		// 	tree.configPath = normalizerOptions.configPath;
		// }

		// // Prevent dependencies from being processed
		// tree.dependencies = [];

		// return projectPreprocessor.processTree(tree);

		const {normalizer} = require("@ui5/project");
		const project = await normalizer.generateProjectTree(normalizerOptions);
		return project;
	}

	async init({config, logger}) {
		this.config = config;
		this.logger = logger.create("ui5.framework");
		this.logger.log("debug", "Initializing framework...");

		this.applyDefaults(config);

		this.validateConfig(config);

		// TODO: use paths from ui5 project object
		this.config.ui5.paths = this.config.ui5.paths || {
			webapp: "webapp",
			src: "src",
			test: "test"
		};

		this.checkPaths();

		await this.autoDetectType();

		if (this.config.ui5.mode === "script") {
			require("./mode/script").init(config);
		} else {
			require("./mode/html").init(config);
		}

		if (this.config.ui5.type === "application") {
			await require("./type/application").init(config, logger);
		} else if (config.ui5.type === "library") {
			await require("./type/library").init(config, logger);
		} else {
			this.logger.log("error", ErrorMessage.invalidProjectType(config.ui5.type) );
			throw new Error(ErrorMessage.failure());
		}

		// Before karma handles the request we need to rewrite the url so that local files can be found
		this.beforeMiddleware.use((req, res, next) => {
			req.url = rewriteUrl.toFileSystem(req.url, config);
			next();
		});

		// Before we are handling the request we need to rewrite the url back to a virtual path
		// so that the UI5 server or proxy can find the resources
		this.middleware.use((req, res, next) => {
			req.url = rewriteUrl.toVirtual(req.url, config);
			next();
		});

		if (this.config.ui5.url) {
			await require("./middleware/proxy").init(this.middleware, this.config.ui5.url);
		} else {
			if (!this.ui5Project) {
				// Only load project if not done already via autoDetectType
				this.ui5Project = await this._getProjectTree();
			}
			await require("./middleware/ui5").init(this.middleware, this.ui5Project);
		}

		this.logger.log("debug", "Framework initialized");
	}

	async autoDetectType() {
		if (this.config.ui5.type) {
			return;
		}
		// TODO: if ui5.yaml exists
		if (exists(path.join(this.config.basePath, "ui5.yaml"))) {
			this.ui5Project = await this._getProjectTree();

			// TODO: fail when kind is not null or project?

			this.config.ui5.type = this.ui5Project.type;
		} else {
			this.config.ui5.type = this.detectTypeFromFolder();

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
	}
}

module.exports = Framework;
