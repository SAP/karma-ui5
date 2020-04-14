const path = require("path");
const {ErrorMessage} = require("./errors");
const {exists, pathsExist} = require("./utils");

const project = {
	init: async (config, log, {createTree}) => {
		// TODO: use paths from ui5 project object?
		config.ui5.paths = config.ui5.paths || {
			webapp: "webapp",
			src: "src",
			test: "test"
		};
		await project._checkPaths(config);

		let tree;
		if (createTree) {
			tree = await project._getProjectTree(config);
		}

		await project._autoDetectType(config, log, tree);
		await project._initType(config);

		return tree;
	},
	_checkPaths: (config, log) => {
		["webapp", "src", "test"].forEach((pathName) => {
			let pathValue = config.ui5.paths[pathName];
			if (!pathValue) {
				return;
			}

			let absolutePathValue;
			const absoluteBasePath = path.resolve(config.basePath);

			// Make sure paths are relative to the basePath
			if (path.isAbsolute(pathValue)) {
				absolutePathValue = pathValue;
				pathValue = path.relative(config.basePath, pathValue);
			} else {
				absolutePathValue = path.resolve(config.basePath, pathValue);
			}

			// Paths must be within basePath
			if (!absolutePathValue.startsWith(absoluteBasePath)) {
				log.error(ErrorMessage.pathNotWithinBasePath({
					pathName,
					pathValue: config.ui5.paths[pathName], // use value given in config here
					absolutePathValue,
					basePath: absoluteBasePath
				}));
				throw new Error(ErrorMessage.failure());
			}

			config.ui5.paths[pathName] = pathValue;
		});
	},
	_autoDetectType: async (config, log, tree) => {
		if (config.ui5.type) {
			return;
		}
		// TODO: if ui5.yaml exists
		if (exists(path.join(config.basePath, "ui5.yaml"))) {
			if (tree) {
				config.ui5.type = tree.type;
			} else {
				// The tree is not loaded already, as it is not required for initializing the middleware.
				// In this case just load the project config without processing the dependencies
				const project = await project._getProjectTree(project, true);
				config.ui5.type = project.type;
			}
			// TODO: fail when kind is not null or project?
		} else {
			config.ui5.type = project._detectTypeFromFolder(config);

			if (!config.ui5.type) {
				let errorText = "";

				if (config.basePath.endsWith("/webapp")) {
					errorText = ErrorMessage.invalidBasePath();
				} else {
					errorText = ErrorMessage.invalidFolderStructure();
				}

				log.error(errorText);
				throw new Error(ErrorMessage.failure());
			}
		}
	},
	_initType: async (config, log) => {
		if (config.ui5.type === "application") {
			const applicationType = require("./type/application");
			await applicationType.init(config, log);
		} else if (config.ui5.type === "library") {
			const libraryType = require("./type/library");
			await libraryType.init(config, log);
		} else {
			log.error(ErrorMessage.invalidProjectType(config.ui5.type) );
			throw new Error(ErrorMessage.failure());
		}
	},
	_getProjectTree: async (config, ignoreDependencies = false) => {
		const {normalizer, projectPreprocessor} = require("@ui5/project");
		const normalizerOptions = {
			cwd: config.basePath
		};
		if (ignoreDependencies) {
			const tree = await normalizer.generateDependencyTree(normalizerOptions);

			if (normalizerOptions.configPath) {
				tree.configPath = normalizerOptions.configPath;
			}

			// Prevent dependencies from being processed
			tree.dependencies = [];

			return projectPreprocessor.processTree(tree);
		} else {
			return normalizer.generateProjectTree(normalizerOptions);
		}
	},
	_detectTypeFromFolder: (config) => {
		const webappFolder = config.ui5.paths.webapp;
		const srcFolder = config.ui5.paths.src;
		const testFolder = config.ui5.paths.test;
		const [hasWebapp, hasSrc, hasTest] = pathsExist(config.basePath, [webappFolder, srcFolder, testFolder]);
		if (hasWebapp) return "application";
		if (hasSrc && hasTest) return "library";
	}
};

module.exports = project;
