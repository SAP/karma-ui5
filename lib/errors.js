module.exports = {
	ErrorMessage: {
		incompatibleFrameworks: (frameworks) => {
			let errorMessage = "error 1:\nThe \"karma-ui5\" plugin is not compatible " +
				"with certain framework plugins when running in \"html\" mode.";
			if (frameworks.includes("qunit")) {
				errorMessage += "\nQUnit is supported out of the box.";
			}
			if (frameworks.includes("sinon")) {
				errorMessage += "\nSinon should be loaded from the test.";
			}
			errorMessage += `
Please make sure not to define "ui5" along with any of the above mentioned plugins your karma config.`;
			return errorMessage;
		},

		containsFilesDefinition: () => `error 2:
The "karma-ui5" plugin automatically sets the "files" config when running in "html" mode.
There is no need to manually define file patterns.

Please make sure to remove defined "files" in your karma config:

module.exports = function(config) {
	config.set({

		files: {
			{ ... }
		}

	});
};`,
		customPathWithoutType: () => `error 3:
Custom "paths" have been defined but a "type" is missing

Please add a type (application or library) to your configuration

module.exports = function(config) {
	config.set({

		ui5: {
			type: "application|library"
		}

	});
};
`,
		applicationFolderNotFound: (webappFolder) => `error 4:
Could not find defined path to your "webapp" folder.

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
`,
		libraryFolderNotFound: (args) => `error 5:
Could not find defined paths to your "src" / "test" folders.

Please check if the configured paths are correct:

module.exports = function(config) {
	config.set({

		ui5: {
			type: "library",
			paths: {
				src: "${args.srcFolder}" ${!args.hasSrc ? "\t<-- Not found" : ""}
				test: "${args.testFolder}" ${!args.hasTest ? "\t<-- Not found" : ""}
			}
		}

	});
};
`,
		invalidProjectType: (type) => `error 6:
Invalid project type defined.

Valid types: "application" / "library"

module.exports = function(config) {
	config.set({

		ui5: {
			type: "${type}"
		}

	});
};
`,

		urlRewriteFailed: (type) => `error 7:
Failed to rewrite url. The type "${type}" is not supported.
Please use "library" or "application" as type.

module.exports = function(config) {
	config.set({

		ui5: {
			type: "${type}"\t<-- Invalid. Must be "application" or "library"
		}

	});
};`,
		invalidUI5Yaml: ({filePath, yamlException}) => `error 8:
Could not parse ${filePath}:

${yamlException}

Please make sure that the ui5.yaml has a valid format.
For reference check: https://github.com/SAP/ui5-project/blob/master/docs/Configuration.md#configuration
`,
		missingTypeInYaml: () => `error 9:
Project doesn't have a type configured. Please make sure that the ui5.yaml has a type declared.
For reference check: https://github.com/SAP/ui5-project/blob/master/docs/Configuration.md#configuration
`,
		invalidBasePath: () => `error 10:
Project type could not be detected.
It seems that your "basePath" points to the "webapp" folder of your project.

Please make sure that the "basePath" points to your project root.
If your karma.conf.js is in your project root, you can omit the "basePath" or set it to an empty string.

module.exports = function(config) {
	config.set({

		basePath: "",

	});
};
`,
		invalidFolderStructure: () => `error 11:
Project type could not be detected.
Your project seems to have an unknown folder structure, so a type could not be detected.
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
`,
		migrateConfig: () => `error 12:
Please migrate your configuration:
https://github.com/SAP/karma-ui5/blob/master/docs/migrate-v1.md`,
		invalidMode: (mode) => `error 13:
The mode defined in your config is invalid. Mode must be "script" or "html" (default).

module.exports = function(config) {
	config.set({
		ui5: {
			mode: "${mode}"\t<-- Invalid. Must be "script" or "html"
		}
	});
};`,
		urlParametersConfigInNonHtmlMode: (mode, urlParameters) => `error 14:
The urlParameters configuration can only be used in "html" mode

module.exports = function(config) {
	config.set({
		ui5: {
			mode: "${mode}"

			// Cannot be used in combination with mode "${mode}":
			urlParameters: ${JSON.stringify(urlParameters, null, "\t").split("\n").join("\n\t\t\t")}
		}
	});
};`,
		urlParametersNotAnArray: (urlParameters) => `error 15:
The urlParameters configuration must be an array but is of type "${typeof urlParameters}".

module.exports = function(config) {
	config.set({
		ui5: {
			// Must be an array:
			urlParameters: ${JSON.stringify(urlParameters, null, "\t").split("\n").join("\n\t\t\t")}
		}
	});
};`,
		urlParameterNotObject: (urlParameter) => `error 16:
The urlParameters configuration must be an array of objects.
But entry ${JSON.stringify(urlParameter)} is of type "${typeof urlParameter}".`,

		urlParameterMissingKeyOrValue: (urlParameter) => `error 17:
Every urlParameters configuration entry must have properties "key" and "value":
${JSON.stringify(urlParameter)}
`,

		pathNotWithinBasePath: ({pathName, pathValue, absolutePathValue, basePath}) => `error 18:
Configured "${pathName}" folder must be within configured "basePath" folder.

${absolutePathValue}
not within
${basePath}

Please check if the configured paths are correct:

module.exports = function(config) {
	config.set({

		ui5: {
			paths: {
				${pathName}: "${pathValue}" \t<--
			}
		}

	});
};
`,

		failOnEmptyTestPageNotTypeBoolean: (failOnEmptyTestPage) => `error 19:
The failOnEmptyTestPage configuration must be of type "boolean"
but found type "${typeof failOnEmptyTestPage}".

module.exports = function(config) {
	config.set({
		ui5: {
			failOnEmptyTestPage: ${JSON.stringify(failOnEmptyTestPage, null, "\t")}
		}
	});
};`,

		failOnEmptyTestPageInNonHtmlMode: (mode) => `error 20:
The failOnEmptyTestPage configuration can only be used in "html" mode

module.exports = function(config) {
	config.set({
		ui5: {
			mode: "${mode}"

			// Cannot be used in combination with mode "${mode}":
			failOnEmptyTestPage: true
		}
	});
};`,

		invalidFileExportReporterUsage: () => `error 21:
The reporter "ui5--fileExport" should not be manually enabled as a karma reporter.
You can enable the FileExportReporter in the karma-ui5 settings.

module.exports = function(config) {
	config.set({

		ui5: {
			fileExport: true
		}

	});
};

Optionally, an output directory can be set to specify the export path.

module.exports = function(config) {
	config.set({

		ui5: {
			fileExport: {
				outputDir: "directory/to/export/files"
			}
		}

	});
};
`,

		failure: () => "ui5.framework failed. See error message above"

	}
};
