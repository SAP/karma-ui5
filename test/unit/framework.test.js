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

describe("Middleware for UI5", () => {
	it("Should rewrite url in beforeMiddleware (library only)", async () => {
		let resolve;
		const donePromise = new Promise((_resolve) => {
			resolve = _resolve;
		});
		expect.assertions(4);

		const config = {
			ui5: {
				type: "library"
			}
		};
		const framework = new Framework();
		framework.exists = () => true;
		await framework.init({config, logger});
		expect(config["middleware"]).toContain("ui5--middleware");
		expect(config["beforeMiddleware"]).toContain("ui5--beforeMiddleware");

		const rewriteUrlBeforeSpy = jest.spyOn(framework, "rewriteUrlBefore");

		const beforeMiddleware = framework.beforeMiddleware;

		const req = {
			url: "/foo"
		};

		beforeMiddleware(req, {}, function() {
			expect(rewriteUrlBeforeSpy).toBeCalledWith("/foo");
			expect(req.url).toBe("/foo");
			resolve();
		});

		return donePromise;
	});

	it("Should rewrite url in middleware", async () => {
		let resolve;
		const donePromise = new Promise((_resolve) => {
			resolve = _resolve;
		});
		expect.assertions(3);

		const config = {
			ui5: {
				type: "application"
			}
		};
		const framework = new Framework();
		framework.exists = () => true;
		await framework.init({config, logger});
		expect(config["middleware"]).toContain("ui5--middleware");

		const rewriteUrlSpy = jest.spyOn(framework, "rewriteUrl");

		const middleware = framework.middleware;

		const req = {
			url: "/foo"
		};

		middleware(req, {}, function() {
			expect(rewriteUrlSpy).toBeCalledWith("/foo");
			expect(req.url).toBe("/foo");
			resolve();
		});

		return donePromise;
	});
});

describe("Proxy for UI5 ", () => {
	it("Should call proxy module from middleware (http)", () => {
		const proxyServer = new Framework().setupProxy({
			url: "http://localhost"
		});

		const createProxyServer = require("http-proxy").createProxyServer;

		const lastCall = createProxyServer.mock.calls[createProxyServer.mock.calls.length - 1];
		expect(lastCall[0]).toMatchObject({
			target: "http://localhost",
			changeOrigin: true,
			agent: expect.objectContaining({
				keepAlive: true,
				protocol: "http:"
			})
		});

		const proxy = createProxyServer.mock.results[createProxyServer.mock.results.length - 1].value;

		expect(proxy.on).toBeCalledWith("error", expect.any(Function));

		const req = {};
		const res = {};
		proxyServer(req, res);

		expect(proxy.web).toBeCalledWith(req, res);
	});

	it("Should call proxy module from middleware (https)", () => {
		const proxyServer = new Framework().setupProxy({
			url: "https://localhost"
		});

		const createProxyServer = require("http-proxy").createProxyServer;

		const lastCall = createProxyServer.mock.calls[createProxyServer.mock.calls.length - 1];
		expect(lastCall[0]).toMatchObject({
			target: "https://localhost",
			changeOrigin: true,
			agent: expect.objectContaining({
				keepAlive: true,
				protocol: "https:"
			})
		});

		const proxy = createProxyServer.mock.results[createProxyServer.mock.results.length - 1].value;

		expect(proxy.on).toBeCalledWith("error", expect.any(Function));

		const req = {};
		const res = {};
		proxyServer(req, res);

		expect(proxy.web).toBeCalledWith(req, res);
	});
});

describe("UI5 Middleware / Proxy configuration", () => {
	it("Should setup proxy middleware when url is configured", async () => {
		const framework = new Framework();
		framework.exists = () => true;
		const setupProxySpy = jest.spyOn(framework, "setupProxy");
		const config = {
			ui5: {
				url: "http://localhost",
				type: "application"
			}
		};

		await framework.init({config, logger});

		expect(setupProxySpy).toHaveBeenCalledWith({
			failOnEmptyTestPage: false,
			mode: "html",
			url: "http://localhost",
			type: "application",
			paths: {
				webapp: "webapp",
				src: "src",
				test: "test"
			}
		});
	});

	it.skip("Should setup UI5 tooling middleware if ui5.yaml is present", async () => {
		const framework = new Framework();
		framework.exists = () => true;
		const setupUI5Server = jest.spyOn(framework, "setupUI5Server");

		framework.init({config: {}, logger});

		expect(setupUI5Server).toHaveBeenCalledWith(/* basePath */ "");
	});

	// Sad path
	it.skip("Should throw if ui5.yaml is missing and no url is configured", async () => {
		const framework = new Framework();

		expect(framework.init({config: {}, logger})).rejects.toEqual({});
	});
});

describe("ui5.paths handling", () => {
	it("application: Should resolve relative path relative to basePath", async () => {
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
	it("application: Should resolve absolute path relative to basePath", async () => {
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

	it("library: Should resolve relative paths relative to basePath", async () => {
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
	it("library: Should resolve absolute paths relative to basePath", async () => {
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

describe("rewriteUrl", () => {
	const framework = new Framework();
	framework.exists = () => true;
	framework.init({config: { }, logger});

	const assertRewriteUrl = ([input, expected]) => {
		expect(framework.rewriteUrl(input)).toEqual(expected);
	};

	it("Should rewrite url for application", async () => {
		framework.config.ui5.type = "application";

		// Good path
		assertRewriteUrl([
			"/base/webapp/resources/sap-ui-core.js",
			"/resources/sap-ui-core.js"
		]);
		assertRewriteUrl([
			"/base/webapp/test-resources/sap/ui/test/",
			"/test-resources/sap/ui/test/"
		]);
		assertRewriteUrl([
			"/base/webapp/foo.js",
			"/foo.js"
		]);

		// Sad path (no rewrite)
		assertRewriteUrl([
			"/webapp/resources/sap-ui-core.js",
			"/webapp/resources/sap-ui-core.js"
		]);
		assertRewriteUrl([
			"/webapp/test-resources/sap/ui/test/",
			"/webapp/test-resources/sap/ui/test/"
		]);
		assertRewriteUrl([
			"/base/resources/sap-ui-core.js",
			"/base/resources/sap-ui-core.js"
		]);
		assertRewriteUrl([
			"/base/test-resources/sap/ui/test/",
			"/base/test-resources/sap/ui/test/"
		]);
		assertRewriteUrl([
			"/resources/sap-ui-core.js",
			"/resources/sap-ui-core.js"
		]);
		assertRewriteUrl([
			"/test-resources/sap/ui/test/",
			"/test-resources/sap/ui/test/"
		]);
	});

	it("Should rewrite url for library", async () => {
		framework.config.ui5.type = "library";

		// Good path
		assertRewriteUrl([
			"/base/src/sap-ui-core.js",
			"/resources/sap-ui-core.js"
		]);
		assertRewriteUrl([
			"/base/test/sap/ui/test/",
			"/test-resources/sap/ui/test/"
		]);
		// TODO: is this expected? (see code)
		// assertRewriteUrl([
		// 	"/base/foo.js",
		// 	"/foo.js"
		// ]);

		// Sad path (no rewrite)
		assertRewriteUrl([
			"/src/sap-ui-core.js",
			"/src/sap-ui-core.js"
		]);
		assertRewriteUrl([
			"/test/sap/ui/test/",
			"/test/sap/ui/test/"
		]);
		assertRewriteUrl([
			"/webapp/resources/sap-ui-core.js",
			"/webapp/resources/sap-ui-core.js"
		]);
		assertRewriteUrl([
			"/webapp/test-resources/sap/ui/test/",
			"/webapp/test-resources/sap/ui/test/"
		]);
		assertRewriteUrl([
			"/base/resources/sap-ui-core.js",
			"/base/resources/sap-ui-core.js"
		]);
		assertRewriteUrl([
			"/base/test-resources/sap/ui/test/",
			"/base/test-resources/sap/ui/test/"
		]);
		assertRewriteUrl([
			"/resources/sap-ui-core.js",
			"/resources/sap-ui-core.js"
		]);
		assertRewriteUrl([
			"/test-resources/sap/ui/test/",
			"/test-resources/sap/ui/test/"
		]);
	});

	it("Should not rewrite url when no type is given", async () => {
		framework.config.ui5.type = undefined;

		assertRewriteUrl([
			"/base/webapp/resources/sap-ui-core.js",
			"/base/webapp/resources/sap-ui-core.js"
		]);
		assertRewriteUrl([
			"/base/webapp/test-resources/sap/ui/test/",
			"/base/webapp/test-resources/sap/ui/test/"
		]);
		assertRewriteUrl([
			"/base/webapp/foo.js",
			"/base/webapp/foo.js"
		]);
		assertRewriteUrl([
			"/base/src/sap-ui-core.js",
			"/base/src/sap-ui-core.js"
		]);
		assertRewriteUrl([
			"/base/test/sap/ui/test/",
			"/base/test/sap/ui/test/"
		]);
		assertRewriteUrl([
			"/base/foo.js",
			"/base/foo.js"
		]);
	});

	it("Should throw error when invalid type is given", async () => {
		framework.config.ui5.type = "foo";

		const loggerSpy = jest.spyOn(framework.logger, "log");
		framework.rewriteUrl("/foo");
		expect(loggerSpy).toBeCalled();
	});
});

describe("rewriteUrlBefore", () => {
	const framework = new Framework();
	framework.exists = () => true;
	framework.init({config: { }, logger});

	const assertRewriteUrlBefore = ([input, expected]) => {
		expect(framework.rewriteUrlBefore(input)).toEqual(expected);
	};

	it("Should rewrite url for library", async () => {
		framework.config.ui5.type = "library";

		// Good path
		assertRewriteUrlBefore([
			"/base/resources/sap-ui-core.js",
			"/base/src/sap-ui-core.js",
		]);
		assertRewriteUrlBefore([
			"/base/test-resources/sap/ui/test/",
			"/base/test/sap/ui/test/"
		]);

		// Sad path (no rewrite)
		assertRewriteUrlBefore([
			"/base/src/sap-ui-core.js",
			"/base/src/sap-ui-core.js"
		]);
		assertRewriteUrlBefore([
			"/base/test/sap/ui/test/",
			"/base/test/sap/ui/test/"
		]);
	});

	it("Should rewrite url for library (nested paths)", async () => {
		framework.config.ui5.type = "library";
		framework.config.ui5.paths = {
			src: "src/main/js",
			test: "src/test/js"
		};

		// Good path
		assertRewriteUrlBefore([
			"/base/src/main/resources/sap-ui-core.js",
			"/base/src/main/js/sap-ui-core.js",
		]);
		assertRewriteUrlBefore([
			"/base/src/test/test-resources/sap/ui/test/",
			"/base/src/test/js/sap/ui/test/"
		]);

		assertRewriteUrlBefore([
			"/base/src/test/resources/sap-ui-core.js",
			"/base/src/main/js/sap-ui-core.js",
		]);
		assertRewriteUrlBefore([
			"/base/src/main/test-resources/sap/ui/test/",
			"/base/src/test/js/sap/ui/test/"
		]);

		// Sad path (no rewrite)
		assertRewriteUrlBefore([
			"/base/src/main/js/sap-ui-core.js",
			"/base/src/main/js/sap-ui-core.js"
		]);
		assertRewriteUrlBefore([
			"/base/src/test/js/sap/ui/test/",
			"/base/src/test/js/sap/ui/test/"
		]);
	});

	it("Should not rewrite url for type application", async () => {
		framework.config.ui5.type = "application";

		assertRewriteUrlBefore([
			"/base/webapp/resources/sap-ui-core.js",
			"/base/webapp/resources/sap-ui-core.js"
		]);
		assertRewriteUrlBefore([
			"/base/webapp/test-resources/sap/ui/test/",
			"/base/webapp/test-resources/sap/ui/test/"
		]);
		assertRewriteUrlBefore([
			"/base/webapp/foo.js",
			"/base/webapp/foo.js"
		]);
		assertRewriteUrlBefore([
			"/base/src/sap-ui-core.js",
			"/base/src/sap-ui-core.js"
		]);
		assertRewriteUrlBefore([
			"/base/test/sap/ui/test/",
			"/base/test/sap/ui/test/"
		]);
		assertRewriteUrlBefore([
			"/base/foo.js",
			"/base/foo.js"
		]);
	});

	it("Should not rewrite url when no type is given", async () => {
		framework.config.ui5.type = undefined;

		assertRewriteUrlBefore([
			"/base/webapp/resources/sap-ui-core.js",
			"/base/webapp/resources/sap-ui-core.js"
		]);
		assertRewriteUrlBefore([
			"/base/webapp/test-resources/sap/ui/test/",
			"/base/webapp/test-resources/sap/ui/test/"
		]);
		assertRewriteUrlBefore([
			"/base/webapp/foo.js",
			"/base/webapp/foo.js"
		]);
		assertRewriteUrlBefore([
			"/base/src/sap-ui-core.js",
			"/base/src/sap-ui-core.js"
		]);
		assertRewriteUrlBefore([
			"/base/test/sap/ui/test/",
			"/base/test/sap/ui/test/"
		]);
		assertRewriteUrlBefore([
			"/base/foo.js",
			"/base/foo.js"
		]);
	});
});

describe("Plugin setup", () => {
	it("Should include browser bundle", async () => {
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
	let fsReadFileSyncMock;
	beforeEach(() => {
		fsReadFileSyncMock = jest.spyOn(fs, "readFileSync");
	});
	afterEach(() => {
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
	it("application: Should serve and watch webapp folder", async () => {
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
	});

	it("library: Should modify config file for libraries", async () => {
		const config = {
			ui5: {
				useMiddleware: false,
				type: "library"
			}
		};

		const framework = new Framework();
		framework.exists = () => true;
		await framework.init({config, logger});
		expect(config.files.find((file) => file.pattern.endsWith("/{src/**,src/**/.*}"))).toBeDefined();
		expect(config.files.find((file) => file.pattern.endsWith("/{test/**,test/**/.*}"))).toBeDefined();
	});

	// TODO: What should happen?
	it("no type", async () => {
		const config = {};
		const framework = new Framework();
		framework.exists = () => true;
		await framework.init({config, logger});
	});
});

describe("Testpage", () => {
	it("Configured testpage should be passed to client config", async () => {
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
	it("Configured URL parameters should be passed to client config", async () => {
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

describe("failOnEmptyTestPage", () => {
	it("should default to 'false'", async () => {
		const config = {
			ui5: {}
		};
		const framework = new Framework();
		framework.exists = () => true;
		framework.init({
			config: config,
			logger: logger
		});

		expect(config.ui5.failOnEmptyTestPage).toBe(false);
	});
	it("should pass 'true' value to client", async () => {
		const config = {
			ui5: {
				failOnEmptyTestPage: true
			}
		};
		const framework = new Framework();
		framework.exists = () => true;
		framework.init({
			config: config,
			logger: logger
		});

		expect(config.client.ui5.failOnEmptyTestPage).toBe(true);
	});
	it("should pass 'false' value to client", async () => {
		const config = {
			ui5: {
				failOnEmptyTestPage: false
			}
		};
		const framework = new Framework();
		framework.exists = () => true;
		framework.init({
			config: config,
			logger: logger
		});

		expect(config.client.ui5.failOnEmptyTestPage).toBe(false);
	});
	it("Should throw if failOnEmptyTestPage is not of type boolean (string)", async () => {
		const config = {
			ui5: {failOnEmptyTestPage: "true"}
		};
		const framework = new Framework();
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.failOnEmptyTestPageNotTypeBoolean("true"));
	});
	it("Should throw if failOnEmptyTestPage is not of type boolean (object)", async () => {
		const config = {
			ui5: {failOnEmptyTestPage: {foo: "bar"}}
		};
		const framework = new Framework();
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.failOnEmptyTestPageNotTypeBoolean({foo: "bar"}));
	});
	it("Should throw if failOnEmptyTestPage is used with script mode", async () => {
		const config = {
			ui5: {mode: "script", failOnEmptyTestPage: true}
		};
		const framework = new Framework();
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.failOnEmptyTestPageInNonHtmlMode("script"));
	});
});

describe("Without QUnit HTML Runner (with URL)", () => {
	it("Should include sap-ui-config.js and sap-ui-core.js", async () => {
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

	it("Should include also include autorun.js if tests are configured", async () => {
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
	it("application: Should include sap-ui-config.js and sap-ui-core.js", async () => {
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
	it("application (custom path): Should include sap-ui-config.js and sap-ui-core.js", async () => {
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
	it("library (custom paths): Should include sap-ui-config.js and sap-ui-core.js", async () => {
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
	it("Should implicitly set useIframe to true", async () => {
		const config = {};
		const framework = new Framework();
		framework.exists = () => true;
		await framework.init({config, logger});
		expect(framework.config.client.ui5.useIframe).toBe(true);
	});

	it("Should not overwrite useIframe default (currently not supported)", async () => {
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

	it("Should not throw if a compatible framework has been defined", async () => {
		const config = {
			frameworks: ["foo", "ui5"]
		};
		await expect(framework.init({config, logger})).rejects.
			toThrow(ErrorMessage.failure()); // some unrelated exception
		expect(framework.logger.message).not.toBe(ErrorMessage.incompatibleFrameworks(["foo", "ui5"]));
	});

	it("Should throw if an incompatible framework has been defined (qunit)", async () => {
		const config = {
			frameworks: ["qunit", "ui5"]
		};
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.incompatibleFrameworks(["qunit", "ui5"]));
	});

	it("Should throw if an incompatible framework has been defined (qunit + sinon)", async () => {
		const config = {
			frameworks: ["qunit", "sinon", "ui5"]
		};
		await expect(framework.init({config, logger})).rejects.toThrow(ErrorMessage.failure());
		expect(framework.logger.message).toBe(ErrorMessage.incompatibleFrameworks(["qunit", "sinon", "ui5"]));
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
