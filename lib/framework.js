const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const {ErrorMessage} = require("./errors");
const {
	replaceLast,
	createProjectFilesPattern,
	createPluginFilesPattern,
	pathsExist,
	exists
} = require("./utils");

class Framework {
	constructor() {
		this.config = {};
	}

	/**
	 * Mutates config and auto set type if not defined
	 */
	detectTypeFromFolder() {
		const webappFolder = this.config.ui5.paths.webapp;
		const srcFolder = this.config.ui5.paths.src;
		const testFolder = this.config.ui5.paths.test;
		const [hasWebapp, hasSrc, hasTest] = pathsExist(this.config.basePath, [webappFolder, srcFolder, testFolder]);
		if (hasWebapp) return "application";
		if (hasSrc && hasTest) return "library";
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
				url += `${replaceLast(config.ui5.paths.src, "resources")}/sap-ui-core.js`;
			}
		}
		config.client.ui5.config = config.ui5.config;
		config.client.ui5.tests = config.ui5.tests;
		if (config.ui5.tests) {
			config.files.unshift(createPluginFilesPattern(`${__dirname}/client/autorun.js`));
		}
		config.files.unshift(createPluginFilesPattern(url));
		config.files.unshift(createPluginFilesPattern(`${__dirname}/client/sap-ui-config.js`));
	}

	async init({config, logger}) {
		this.config = config;
		this.logger = logger.create("ui5.framework");
		this.logger.log("debug", "Initializing framework...");
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

		this.checkLegacy(config);

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
			this.config.files.unshift(createPluginFilesPattern(__dirname + "/../dist/browser-bundle.js"));
		}

		// Make testpage url available to the client
		this.config.client.ui5.testpage = this.config.ui5.testpage;

		// Pass configured urlParameters to client
		this.config.client.ui5.urlParameters = this.config.ui5.urlParameters;


		if (this.config.ui5.type === "application") {
			const webappFolder = this.config.ui5.paths.webapp;
			if (!exists(path.join(this.config.basePath, webappFolder))) {
				this.logger.log("error", ErrorMessage.applicationFolderNotFound(webappFolder));
				throw new Error(ErrorMessage.failure());
			}

			// Match all files (including dotfiles)
			this.config.files.push(
				createProjectFilesPattern(config.basePath + `/{${webappFolder}/**,${webappFolder}/**/.*}`)
			);
		} else if (config.ui5.type === "library") {
			const srcFolder = this.config.ui5.paths.src;
			const testFolder = this.config.ui5.paths.test;

			const [hasSrc, hasTest] = pathsExist(this.config.basePath, [srcFolder, testFolder]);
			if (!hasSrc || !hasTest) {
				this.logger.log("error", ErrorMessage.libraryFolderNotFound({
					srcFolder, testFolder, hasSrc, hasTest
				}));
				throw new Error(ErrorMessage.failure());
			}

			this.config.files.push(
				// Match all files (including dotfiles)
				createProjectFilesPattern(`${config.basePath}/{${srcFolder}/**,${srcFolder}/**/.*}`),
				createProjectFilesPattern(`${config.basePath}/{${testFolder}/**,${testFolder}/**/.*}`),
			);
		} else {
			this.logger.log("error", ErrorMessage.invalidProjectType(config.ui5.type) );
			throw new Error(ErrorMessage.failure());
		}

		this.logger.log("debug", "Framework initialized");
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
}

module.exports = Framework;
