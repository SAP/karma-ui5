import test from "ava";
import sinonGlobal from "sinon";
import esmock from "esmock";
import {readFileSync} from "node:fs";
import {ErrorMessage} from "../../../lib/errors.js";

test.beforeEach(async (t) => {
	const sinon = t.context.sinon = sinonGlobal.createSandbox();

	t.context.logger = {
		create: function() {
			return {
				type: "",
				message: "",
				log: function(type, message) {
					this.type = type;
					this.message = message;
				},
			};
		}
	};

	t.context.readFileSyncStub = sinon.stub().callsFake(readFileSync);

	const Framework = await esmock("../../../lib/framework.js", {
		"node:fs": {
			readFileSync: t.context.readFileSyncStub
		}
	});

	t.context.framework = new Framework();
});

test.afterEach.always((t) => {
	t.context.sinon.restore();
});

test("Should throw if old configuration with openui5 is used", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		openui5: {}
	};
	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.is(framework.logger.message, ErrorMessage.migrateConfig());
});

test("Should throw if invalid mode is defined", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			mode: "foo"
		}
	};
	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.is(framework.logger.message, ErrorMessage.invalidMode("foo"));
});

test("Should throw if urlParameters configuration is used in script mode", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			mode: "script",
			urlParameters: [
				{
					key: "test",
					value: "pony"
				}
			]
		}
	};
	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.is(framework.logger.message, ErrorMessage.urlParametersConfigInNonHtmlMode("script", [{
		key: "test",
		value: "pony"
	}]));
});

test("Should throw if urlParameters configuration is not an array", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			urlParameters: "🐬"
		}
	};
	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.is(framework.logger.message, ErrorMessage.urlParametersNotAnArray("🐬"));
});

test("Should throw if urlParameters configuration does not contain objects", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			urlParameters: [{
				key: "hidepassed",
				value: "true"
			},
			"test=pony"
			]
		}
	};
	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.is(framework.logger.message, ErrorMessage.urlParameterNotObject("test=pony"));
});

test("Should throw if urlParameters configuration is missing \"value\" property", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			urlParameters: [{
				key: "hidepassed",
				value: "true"
			},
			{
				key: "🐧"
			}]
		}
	};
	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.is(framework.logger.message, ErrorMessage.urlParameterMissingKeyOrValue({
		key: "🐧"
	}));
});

test("Should not throw if a compatible framework has been defined", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		frameworks: ["foo", "ui5"]
	};
		// some unrelated exception
	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.not(framework.logger.message, ErrorMessage.incompatibleFrameworks(["foo", "ui5"]));
});

test("Should throw if an incompatible framework has been defined (qunit)", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		frameworks: ["qunit", "ui5"]
	};
	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.is(framework.logger.message, ErrorMessage.incompatibleFrameworks(["qunit", "ui5"]));
});

test("Should throw if an incompatible framework has been defined (qunit + sinon)", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		frameworks: ["qunit", "sinon", "ui5"]
	};
	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.is(framework.logger.message, ErrorMessage.incompatibleFrameworks(["qunit", "sinon", "ui5"]));
});

test("Should throw if files have been defined in config", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		files: [
			{pattern: "**", included: false, served: true, watched: true}
		]
	};
	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.is(framework.logger.message, ErrorMessage.containsFilesDefinition());
});

test("Should throw if custom paths have been defined but the type was not set", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			paths: {
				webapp: "path/to/webapp"
			}
		}
	};
	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.is(framework.logger.message, ErrorMessage.customPathWithoutType());
});

test("Should throw if project type is invalid", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			type: "invalid"
		}
	};
	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.is(framework.logger.message, ErrorMessage.invalidProjectType(config.ui5.type));
});

test("Should throw if basePath doesn't point to project root", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		basePath: "/webapp"
	};
	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.is(framework.logger.message, ErrorMessage.invalidBasePath());
});

test("Should throw if appliacation (webapp) folder in path wasn't found", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			type: "application",
			paths: {
				webapp: "path/does/not/exist"
			}
		}
	};
	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.is(framework.logger.message, ErrorMessage.applicationFolderNotFound(config.ui5.paths.webapp));
});

test("Should throw if library folders (src and test) have not been found", async (t) => {
	const {framework, logger} = t.context;

	const config = {
		ui5: {
			type: "library",
			paths: {
				src: "path/to/src/does/not/exist",
				test: "path/to/test/does/not/exist"
			}
		}
	};
	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.is(framework.logger.message, ErrorMessage.libraryFolderNotFound({
		hasSrc: false,
		hasTest: false,
		srcFolder: config.ui5.paths.src,
		testFolder: config.ui5.paths.test
	}));
});

test("Should throw if detect type based on folder structure fails", async (t) => {
	const {framework, logger} = t.context;

	const config = {};
	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.is(framework.logger.message, ErrorMessage.invalidFolderStructure());
});

test("Should throw if ui5.yaml was found but contains no type", async (t) => {
	const {framework, logger, readFileSyncStub} = t.context;

	readFileSyncStub.returns("---\n");

	const config = {};
	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.is(framework.logger.message, ErrorMessage.missingTypeInYaml());
});

test("Should throw if ui5.yaml was found but has parsing errors", async (t) => {
	const {framework, logger, readFileSyncStub} = t.context;

	readFileSyncStub.returns("a:\na:");

	const yamlException = new Error(
		"duplicated mapping key in \"ui5.yaml\" (2:1)\n\n" +
		" 1 | a:\n" +
		" 2 | a:\n" +
		"-----^"
	);
	yamlException.name = "YAMLException";

	const config = {};
	await t.throwsAsync(framework.init({config, logger}), {
		message: ErrorMessage.failure()
	});
	t.is(framework.logger.message, ErrorMessage.invalidUI5Yaml({
		filePath: "ui5.yaml", yamlException
	}));
});
