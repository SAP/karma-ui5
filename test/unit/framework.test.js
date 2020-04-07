const Framework = require("../../lib/framework");
const path = require("path");
const fs = require("fs");
const {ErrorMessage} = require("../../lib/errors");

const logger = {
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

describe("ui5.paths handling", () => {
	it.skip("application: Should resolve relative path relative to basePath", async () => {
		const framework = new Framework();
		const config = {
			ui5: {
				url: "http://localhost",
				type: "application",
				paths: {
					webapp: "webapp-path"
				}
			}
		};

		framework.exists = (filePath) => {
			return filePath === "webapp-path";
		};

		await framework.init({config, logger});

		expect(config.ui5.paths).toStrictEqual({
			webapp: "webapp-path"
		});
	});
	it.skip("application: Should resolve absolute path relative to basePath", async () => {
		const framework = new Framework();
		const config = {
			ui5: {
				url: "http://localhost",
				type: "application",
				paths: {
					webapp: path.resolve("webapp-path")
				}
			}
		};

		framework.exists = (filePath) => {
			return filePath === "webapp-path";
		};

		await framework.init({config, logger});

		expect(config.ui5.paths).toStrictEqual({
			webapp: "webapp-path"
		});
	});

	it.skip("library: Should resolve relative paths relative to basePath", async () => {
		const framework = new Framework();
		const config = {
			ui5: {
				url: "http://localhost",
				type: "library",
				paths: {
					src: "src-path",
					test: "test-path"
				}
			}
		};

		framework.exists = (filePath) => {
			return filePath === "src-path" || filePath === "test-path";
		};

		await framework.init({config, logger});

		expect(config.ui5.paths).toStrictEqual({
			src: "src-path",
			test: "test-path"
		});
	});
	it.skip("library: Should resolve absolute paths relative to basePath", async () => {
		const framework = new Framework();
		const config = {
			ui5: {
				url: "http://localhost",
				type: "library",
				paths: {
					src: path.resolve("src-path"),
					test: path.resolve("test-path")
				}
			}
		};

		framework.exists = (filePath) => {
			return filePath === "src-path" || filePath === "test-path";
		};

		await framework.init({config, logger});

		expect(config.ui5.paths).toStrictEqual({
			src: "src-path",
			test: "test-path"
		});
	});

	it("application: Should throw error when absolute path is not within basePath", async () => {
		const framework = new Framework();
		const config = {
			basePath: "/test/bar",
			ui5: {
				url: "http://localhost",
				type: "application",
				paths: {
					webapp: "/test/foo/webapp-path"
				}
			}
		};

		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());

		expect(framework.logger.message).toBe(ErrorMessage.pathNotWithinBasePath({
			pathName: "webapp",
			pathValue: "/test/foo/webapp-path",
			absolutePathValue: "/test/foo/webapp-path",
			basePath: "/test/bar"
		}));
	});
	it("application: Should throw error when relative path is not within basePath", async () => {
		const framework = new Framework();
		const config = {
			basePath: "/test/bar",
			ui5: {
				url: "http://localhost",
				type: "application",
				paths: {
					webapp: "../foo/webapp-path"
				}
			}
		};

		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());

		expect(framework.logger.message).toBe(ErrorMessage.pathNotWithinBasePath({
			pathName: "webapp",
			pathValue: "../foo/webapp-path",
			absolutePathValue: "/test/foo/webapp-path",
			basePath: "/test/bar"
		}));
	});
});

describe("Plugin setup", () => {
	it.skip("Should include browser bundle", async () => {
		const config = {
			ui5: {useMiddleware: false}
		};
		const framework = new Framework();
		framework.exists = () => true;
		await framework.init({config, logger});
		expect(config.files[0].pattern).toContain("browser-bundle.js");
		expect(config.files[0].included).toBe(true);
		expect(config.files[0].served).toBe(true);
		expect(config.files[0].watched).toBe(false);
	});
});

describe("Type detection", () => {
	let fsStatSyncMock;
	let fsReadFileSyncMock;
	beforeEach(() => {
		fsStatSyncMock = jest.spyOn(fs, "statSync");
		fsStatSyncMock.mockImplementation(function() {
			return {isDirectory: () => true};
		});
		fsReadFileSyncMock = jest.spyOn(fs, "readFileSync");
	});
	afterEach(() => {
		fsStatSyncMock.mockRestore();
		fsReadFileSyncMock.mockRestore();
	});

	it("Should auto-detect application project from ui5.yaml", async () => {
		fsReadFileSyncMock.mockImplementationOnce(function(filePath) {
			if (filePath === "ui5.yaml") {
				return "---\ntype: application\n";
			}
		});

		const config = {};
		const framework = new Framework();
		framework.exists = () => true;
		await framework.init({config, logger});

		expect(config.ui5.type).toBe("application");
	});

	it("Should auto-detect library project from ui5.yaml", async () => {
		fsReadFileSyncMock.mockImplementationOnce(function(filePath) {
			if (filePath === "ui5.yaml") {
				return "---\ntype: library\n";
			}
		});

		const config = {};
		const framework = new Framework();
		framework.exists = () => true;
		await framework.init({config, logger});

		expect(config.ui5.type).toBe("library");
	});
});

describe("Types configuration", () => {
	it.skip("application: Should serve and watch webapp folder", async () => {
		const config = {
			ui5: {
				useMiddleware: false,
				type: "application"
			}
		};
		const framework = new Framework();
		framework.exists = () => true;
		await framework.init({config, logger});

		const fileConfig = config.files.find((file) => file.pattern.endsWith("/{webapp/**,webapp/**/.*}"));

		expect(fileConfig).toBeDefined();
		expect(fileConfig.included).toBe(false);
		expect(fileConfig.served).toBe(true);
		expect(fileConfig.watched).toBe(true);

		expect(config.proxies).toBeUndefined();
	});

	it.skip("library: Should modify config file for libraries", () => {
		const config = {
			ui5: {
				useMiddleware: false,
				type: "library"
			}
		};

		const framework = new Framework();
		framework.exists = () => true;
		framework.init({config, logger});

		expect(config.files.find((file) => file.pattern.endsWith("/{src/**,src/**/.*}"))).toBeDefined();
		expect(config.files.find((file) => file.pattern.endsWith("/{test/**,test/**/.*}"))).toBeDefined();

		expect(config.proxies).toBeUndefined();
	});

	// TODO: What should happen?
	it.skip("no type", async () => {
		const config = {};
		const framework = new Framework();
		framework.exists = () => true;
		await framework.init({config, logger});
	});
});

describe("Testpage", () => {
	it.skip("Configured testpage should be passed to client config", () => {
		const config = {
			ui5: {
				testpage: "foo"
			}
		};
		const framework = new Framework();
		framework.exists = () => true;
		framework.init({
			config: config,
			logger: logger
		});

		expect(config.client.ui5.testpage).toBe("foo");
	});
});

describe("urlParameters", () => {
	it.skip("Configured URL parameters should be passed to client config", () => {
		const config = {
			ui5: {
				urlParameters: [
					{
						key: "test",
						value: "🦆"
					},
					{
						key: 0,
						value: "🐴"
					}
				]
			}
		};
		const framework = new Framework();
		framework.exists = () => true;
		framework.init({
			config: config,
			logger: logger
		});

		expect(config.client.ui5.urlParameters).toStrictEqual([{
			key: "test",
			value: "🦆"
		}, {
			key: 0,
			value: "🐴"
		}]);
	});
});

describe("Without QUnit HTML Runner (with URL)", () => {
	it.skip("Should include sap-ui-config.js and sap-ui-core.js", async () => {
		const config = {
			ui5: {
				mode: "script",
				url: "https://example.com"
			}
		};
		const framework = new Framework();
		framework.exists = () => true;
		await framework.init({config, logger});
		expect(config.files[0].pattern).toContain("lib/client/sap-ui-config.js");
		expect(config.files[1].pattern).toBe("https://example.com/resources/sap-ui-core.js");
	});

	it.skip("Should include also include autorun.js if tests are configured", async () => {
		const config = {
			ui5: {
				mode: "script",
				url: "https://example.com",
				tests: ["some/test"]
			}
		};
		const framework = new Framework();
		framework.exists = () => true;
		await framework.init({config, logger});
		expect(config.files[0].pattern).toContain("lib/client/sap-ui-config.js");
		expect(config.files[1].pattern).toBe("https://example.com/resources/sap-ui-core.js");
		expect(config.files[2].pattern).toContain("lib/client/autorun.js");
	});
});

describe("Without QUnit HTML Runner (without URL)", () => {
	it.skip("application: Should include sap-ui-config.js and sap-ui-core.js", async () => {
		const config = {

			protocol: "http:",
			port: "1234",
			hostname: "foo",

			ui5: {
				mode: "script",
				type: "application"
			}
		};
		const framework = new Framework();
		framework.exists = () => true;
		await framework.init({config, logger});
		expect(config.files[0].pattern).toContain("lib/client/sap-ui-config.js");
		expect(config.files[1].pattern).toBe("http://foo:1234/base/webapp/resources/sap-ui-core.js");
	});
	it.skip("application (custom path): Should include sap-ui-config.js and sap-ui-core.js", async () => {
		const config = {

			protocol: "http:",
			port: "1234",
			hostname: "foo",

			ui5: {
				mode: "script",
				type: "application",
				paths: {
					webapp: "src/main/webapp"
				}
			}
		};
		const framework = new Framework();
		framework.exists = () => true;
		await framework.init({config, logger});
		expect(config.files[0].pattern).toContain("lib/client/sap-ui-config.js");
		expect(config.files[1].pattern).toBe("http://foo:1234/base/src/main/webapp/resources/sap-ui-core.js");
	});
	it.skip("library (custom paths): Should include sap-ui-config.js and sap-ui-core.js", async () => {
		const config = {

			protocol: "http:",
			port: "1234",
			hostname: "foo",

			ui5: {
				mode: "script",
				type: "library",
				paths: {
					src: "src/main/js",
					test: "src/test/js"
				}
			}
		};
		const framework = new Framework();
		framework.exists = () => true;
		await framework.init({config, logger});
		expect(config.files[0].pattern).toContain("lib/client/sap-ui-config.js");
		expect(config.files[1].pattern).toBe("http://foo:1234/base/src/main/resources/sap-ui-core.js");
	});
});

describe("Execution mode", () => {
	it.skip("Should implicitly set useIframe to true", async () => {
		const config = {};
		const framework = new Framework();
		framework.exists = () => true;
		await framework.init({config, logger});
		expect(framework.config.client.ui5.useIframe).toBe(true);
	});

	it.skip("Should not overwrite useIframe default (currently not supported)", async () => {
		const config = {
			client: {
				ui5: {
					useIframe: false
				}
			}
		};
		const framework = new Framework();
		framework.exists = () => true;
		await framework.init({config, logger});
		expect(framework.config.client.ui5.useIframe).toBe(true);
	});
});

describe("Error logging", () => {
	let framework;

	beforeEach(() => {
		framework = new Framework();
	});

	it("Should throw if old configuration with openui5 is used", async () => {
		const config = {
			openui5: {}
		};
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.migrateConfig());
	});

	it("Should throw if invalid mode is defined", async () => {
		const config = {
			ui5: {
				mode: "foo"
			}
		};
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.invalidMode("foo"));
	});

	it("Should throw if urlParameters configuration is used in script mode", async () => {
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
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.urlParametersConfigInNonHtmlMode("script", [{
			key: "test",
			value: "pony"
		}]));
	});

	it("Should throw if urlParameters configuration is not an array", async () => {
		const config = {
			ui5: {
				urlParameters: "🐬"
			}
		};
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.urlParametersNotAnArray("🐬"));
	});

	it("Should throw if urlParameters configuration does not contain objects", async () => {
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
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.urlParameterNotObject("test=pony"));
	});

	it("Should throw if urlParameters configuration is missing \"value\" property", async () => {
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
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.urlParameterMissingKeyOrValue({
			key: "🐧"
		}));
	});

	it("Should not throw if a non-backlisted framework has been defined", async () => {
		const config = {
			frameworks: ["foo", "ui5"]
		};
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure()); // some unrelated exception
		expect(framework.logger.message).not.toBe(ErrorMessage.blacklistedFrameworks(["foo", "ui5"]));
	});

	it("Should throw if a blacklisted framework has been defined (qunit)", async () => {
		const config = {
			frameworks: ["qunit", "ui5"]
		};
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.blacklistedFrameworks(["qunit", "ui5"]));
	});

	it("Should throw if a blacklisted framework has been defined (qunit + sinon)", async () => {
		const config = {
			frameworks: ["qunit", "sinon", "ui5"]
		};
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.blacklistedFrameworks(["qunit", "sinon", "ui5"]));
	});

	it("Should throw if files have been defined in config", async () => {
		const config = {
			files: [
				{pattern: "**", included: false, served: true, watched: true}
			]
		};
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.containsFilesDefinition());
	});

	it("Should throw if custom paths have been defined but the type was not set", async () => {
		const config = {
			ui5: {
				paths: {
					webapp: "path/to/webapp"
				}
			}
		};
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.customPathWithoutType());
	});

	it("Should throw if project type is invalid", async () => {
		const config = {
			ui5: {
				type: "invalid"
			}
		};
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.invalidProjectType(config.ui5.type));
	});

	it("Should throw if basePath doesn't point to project root", async () => {
		const config = {
			basePath: "/webapp"
		};
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.invalidBasePath());
	});

	it("Should throw if appliacation (webapp) folder in path wasn't found", async () => {
		const config = {
			ui5: {
				type: "application",
				paths: {
					webapp: "path/does/not/exist"
				}
			}
		};
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.applicationFolderNotFound(config.ui5.paths.webapp));
	});

	it("Should throw if library folders (src and test) have not been found", async () => {
		const config = {
			ui5: {
				type: "library",
				paths: {
					src: "path/to/src/does/not/exist",
					test: "path/to/test/does/not/exist"
				}
			}
		};
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.libraryFolderNotFound({
			hasSrc: false,
			hasTest: false,
			srcFolder: config.ui5.paths.src,
			testFolder: config.ui5.paths.test
		}));
	});

	it("Should throw if detect type based on folder structure fails", async () => {
		const config = {};
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.invalidFolderStructure());
	});

	it("Should throw if ui5.yaml was found but contains no type", async () => {
		const fsReadFileSyncMock = jest.spyOn(fs, "readFileSync");
		fsReadFileSyncMock.mockImplementationOnce(function() {
			return "---\n";
		});

		const config = {};
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.missingTypeInYaml());
		fsReadFileSyncMock.mockRestore();
	});

	it("Should throw if ui5.yaml was found but has parsing errors", async () => {
		expect.assertions(2);

		const fsReadFileSyncMock = jest.spyOn(fs, "readFileSync");
		fsReadFileSyncMock.mockImplementationOnce(function() {
			return "--1-\nfoo: 1";
		});

		const yamlException = new Error("Could not parse YAML");
		yamlException.name = "YAMLException";

		const config = {};
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.invalidUI5Yaml({
			filePath: "ui5.yaml", yamlException
		}));
		fsReadFileSyncMock.mockRestore();
	});
});
// TODO: add test to check for client.clearContext
