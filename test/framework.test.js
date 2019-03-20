const Framework = require("../lib/framework");
const fs = require("fs");

const logger = {
	create: function() {
		return {
			log: (errorType, aErrors) => {}
		};
	}
};

describe("Middleware for UI5", () => {
	it("Should pause requests during UI5 server setup and resume once ready", (done) => {
		const config = {
			ui5: {
				useMiddleware: true
			}
		};
		const framework = new Framework().init({config, logger});

		expect(config["beforeMiddleware"]).toContain("ui5--pauseRequests");
		expect(framework.isPaused).toBe(true);

		const processRequestsSpy = jest.spyOn(framework, "processRequests");

		const pauseRequestsMiddleware = framework.pauseRequests();
		pauseRequestsMiddleware({}, {}, function() {
			expect(processRequestsSpy).toBeCalled();
			expect(framework.isPaused).toBe(false);

			setTimeout(function() {
				// Queue should be empty after paused requests have been called
				expect(framework.queue).toHaveLength(0);

				// New requests shouldn't be queued anymore
				pauseRequestsMiddleware({}, {}, function() {
					expect(framework.queue).toHaveLength(0);
					done();
				});
			}, 0);
		});
		expect(framework.queue).toHaveLength(1);
	});

	it("Should rewrite url in serveResources middleware", (done) => {
		const config = {
			ui5: {
				useMiddleware: true
			}
		};
		const framework = new Framework().init({config, logger});
		expect(config["middleware"]).toContain("ui5--serveThemes");
		expect(framework.isPaused).toBe(true);

		const rewriteUrlSpy = jest.spyOn(framework, "rewriteUrl");

		const pauseRequestsMiddleware = framework.pauseRequests();
		const serveResourcesMiddleware = framework.serveResources();

		pauseRequestsMiddleware({}, {}, function() {
			expect(framework.isPaused).toBe(false);
			const internalServeResourcesSpy = jest.spyOn(framework, "_serveResources");

			const req = {url: "/foo"};
			const res = {};
			const next = function() {
				expect(internalServeResourcesSpy).toBeCalledWith(req, res, next);
				expect(rewriteUrlSpy).toBeCalledWith("/foo");
				expect(req.url).toBe("/foo");
				expect(req.path).toBe("/foo");
				done();
			};
			serveResourcesMiddleware(req, res, next);
		});
	});

	it("Should not rewrite url in serveThemes middleware", (done) => {
		const config = {
			ui5: {
				useMiddleware: true
			}
		};
		const framework = new Framework().init({config, logger});
		expect(config["middleware"]).toContain("ui5--serveThemes");
		expect(framework.isPaused).toBe(true);

		const rewriteUrlSpy = jest.spyOn(framework, "rewriteUrl");

		const pauseRequestsMiddleware = framework.pauseRequests();
		const serveThemesMiddleware = framework.serveThemes();

		pauseRequestsMiddleware({}, {}, function() {
			expect(framework.isPaused).toBe(false);
			const internalServeThemesSpy = jest.spyOn(framework, "_serveThemes");

			const req = {url: "/foo"};
			const res = {};
			const next = function() {
				expect(internalServeThemesSpy).toBeCalledWith(req, res, next);
				expect(rewriteUrlSpy).not.toBeCalled();
				expect(req.url).toBe("/foo");
				expect(req.path).toBeUndefined();
				done();
			};
			serveThemesMiddleware(req, res, next);
		});
	});
});

describe("Proxy for UI5 ", () => {
	it("Should call proxy module from serveResources middleware", (done) => {
		const proxyServer = new Framework().setupProxy({
			url: "http://localhost"
		});

		const createProxyServer = require("http-proxy").createProxyServer;

		expect(createProxyServer).toBeCalledWith({
			target: "http://localhost",
			changeOrigin: true
		});

		const proxy = require("http-proxy").createProxyServer.mock.results[0].value;

		expect(proxyServer.serveThemes).toBeUndefined();

		const req = {};
		const res = {};
		const next = function() {
			expect(proxy.web).toBeCalledWith(req, res, next);
			done();
		};
		proxyServer.serveResources(req, res, next);
	});
});

describe("UI5 Middleware / Proxy configuration", () => {
	it("Should setup proxy middleware when url is configured", () => {
		const framework = new Framework();
		const setupProxySpy = jest.spyOn(framework, "setupProxy");
		const config = {
			ui5: {
				url: "http://localhost",
				type: "application"
			}
		};

		framework.init({config, logger});

		expect(setupProxySpy).toHaveBeenCalledWith({
			url: "http://localhost",
			type: "application",
			paths: {
				webapp: "webapp",
				src: "src",
				test: "test"
			}
		});
	});

	it("Should override URL via ui5Url option", () => {
		const config = {
			ui5: {
				type: "application",
				url: "http://localhost"
			},
			ui5Url: "http://other.host" // set when passing --ui5-url or --ui5Url option
		};
		const framework = new Framework();
		const setupProxySpy = jest.spyOn(framework, "setupProxy");

		framework.init({config, logger});

		expect(setupProxySpy).toHaveBeenCalledWith({
			type: "application",
			url: "http://other.host",
			paths: {
				webapp: "webapp",
				src: "src",
				test: "test"
			}
		});
		expect(config.ui5.url).toBe("http://other.host");
	});

	it.skip("Should setup UI5 tooling middleware if ui5.yaml is present", () => {
		const framework = new Framework();
		const setupUI5Server = jest.spyOn(framework, "setupUI5Server");

		framework.init({config: {}, logger});

		expect(setupUI5Server).toHaveBeenCalledWith(/* basePath */ "");
	});

	// Sad path
	it.skip("Should throw if ui5.yaml is missing and no url is configured", () => {
		const framework = new Framework();

		expect(() => {
			framework.init({config: {}, logger});
		}).toThrow();
	});
});


describe("Utility functions", () => {
	const framework = new Framework().init({config: {}, logger});

	const assertRewriteUrl = ([input, expected]) => {
		expect(framework.rewriteUrl(input)).toEqual(expected);
	};

	it("Should rewrite url for application", () => {
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

	it("Should rewrite url for library", () => {
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

	it("Should not rewrite url when no type is given", () => {
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

	it("Should throw error when invalid type is given", () => {
		framework.config.ui5.type = "foo";

		const loggerSpy = jest.spyOn(framework.logger, "log");
		framework.rewriteUrl("/foo");
		expect(loggerSpy).toBeCalled();
	});
});

describe("Plugin setup", () => {
	it("Should include browser bundle", () => {
		const config = {
			ui5: {useMiddleware: false}
		};
		const framework = new Framework();
		framework.init({config, logger});
		expect(config.files[0].pattern).toContain("browser-bundle.js");
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

	it("Should auto-detect application project from ui5.yaml", () => {
		fsReadFileSyncMock.mockImplementationOnce(function(filePath) {
			if (filePath === "ui5.yaml") {
				return `---
specVersion: "1.0"
type: application
metadata:
	name: test.app
`;
			}
		});

		const config = {};
		const framework = new Framework();
		framework.init({config, logger});

		expect(config.ui5.type).toBe("application");
	});

	it("Should auto-detect library project from ui5.yaml", () => {
		fsReadFileSyncMock.mockImplementationOnce(function(filePath) {
			if (filePath === "ui5.yaml") {
				return `---
specVersion: "1.0"
type: library
metadata:
	name: sap.x
`;
			}
		});

		const config = {};
		const framework = new Framework();
		framework.init({config, logger});

		expect(config.ui5.type).toBe("library");
	});
});

describe("Types configuration", () => {
	it("application: Should serve and watch webapp folder", () => {
		const config = {
			ui5: {
				useMiddleware: false,
				type: "application"
			}
		};
		const framework = new Framework();
		framework.init({config, logger});

		expect(config.files.find((file) => file.pattern.endsWith("/{webapp/**,webapp/**/.*}"))).toBeDefined();
	});

	it("library: Should modify config file for libraries", () => {
		const config = {
			ui5: {
				useMiddleware: false,
				type: "library"
			}
		};

		const framework = new Framework();
		framework.init({config, logger});
		expect(config.files.find((file) => file.pattern.endsWith("/{src/**,src/**/.*}"))).toBeDefined();
		expect(config.files.find((file) => file.pattern.endsWith("/{test/**,test/**/.*}"))).toBeDefined();

		expect(config.proxies["/base/resources/"]).toEqual("/base/src/");
		expect(config.proxies["/base/test-resources/"]).toEqual("/base/test/");
	});

	// TODO: What should happen?
	it("no type", () => {
		const config = {};
		const framework = new Framework();
		framework.init({config, logger});
	});
});

describe("Testpage", () => {
	it("Configured testpage should be passed to client config", () => {
		const config = {
			ui5: {
				testpage: "foo"
			}
		};
		const framework = new Framework();
		framework.init({
			config: config,
			logger: logger
		});

		expect(config.client.ui5.testpage).toBe("foo");
	});
});

describe("Without QUnit HTML Runner", () => {
	it("Should include sap-ui-config.js and sap-ui-core.js", () => {
		const config = {
			ui5: {
				htmlrunner: false,
				url: "https://example.com"
			}
		};
		const framework = new Framework();
		framework.init({config, logger});
		expect(config.files[0].pattern).toContain("lib/client/sap-ui-config.js");
		expect(config.files[1].pattern).toBe("https://example.com/resources/sap-ui-core.js");
	});

	it("Should include also include autorun.js if tests are configured", () => {
		const config = {
			ui5: {
				htmlrunner: false,
				url: "https://example.com",
				tests: ["some/test"]
			}
		};
		const framework = new Framework();
		framework.init({config, logger});
		expect(config.files[0].pattern).toContain("lib/client/sap-ui-config.js");
		expect(config.files[1].pattern).toBe("https://example.com/resources/sap-ui-core.js");
		expect(config.files[2].pattern).toContain("lib/client/autorun.js");
	});
});

describe("Execution mode", () => {
	it("Should implicitly set useIframe to true", () => {
		const config = {};
		const framework = new Framework();
		framework.init({config, logger});
		expect(framework.config.client.ui5.useIframe).toBe(true);
	});

	it("Should overwrite useIframe default", () => {
		const config = {
			client: {
				ui5: {
					useIframe: false
				}
			}
		};
		const framework = new Framework();
		framework.init({config, logger});
		expect(framework.config.client.ui5.useIframe).toBe(false);
	});
});
// TODO: add test to check for client.clearContext
