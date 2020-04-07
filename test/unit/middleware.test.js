const Middleware = require("../../lib/middleware");

describe("rewriteUrlBefore", () => {
	const assertRewriteUrlBefore = (middleware, [url, expectedUrl]) => {
		expect(middleware.rewriteUrlBefore(url)).toEqual(expectedUrl);
	};

	it("Should not rewrite urls for application", () => {
		const middleware = new Middleware();
		middleware.config = {
			ui5: {
				type: "application"
			}
		};
		assertRewriteUrlBefore(middleware, [
			"/base/resources/sap/ui/foo/library.js",
			"/base/resources/sap/ui/foo/library.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/test-resources/sap/ui/foo/test.js",
			"/base/test-resources/sap/ui/foo/test.js"
		]);
	});

	it("Should rewrite urls for library", () => {
		const middleware = new Middleware();
		middleware.config = {
			ui5: {
				type: "library",
				paths: {
					src: "src",
					test: "test"
				}
			}
		};
		assertRewriteUrlBefore(middleware, [
			"/base/resources/sap/ui/foo/library.js",
			"/base/src/sap/ui/foo/library.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/test-resources/sap/ui/foo/test.js",
			"/base/test/sap/ui/foo/test.js"
		]);
	});

	it("Should rewrite urls for library with custom paths", () => {
		const middleware = new Middleware();
		middleware.config = {
			ui5: {
				type: "library",
				paths: {
					src: "src/main/js",
					test: "src/test/js"
				}
			}
		};
		assertRewriteUrlBefore(middleware, [
			"/base/src/main/resources/sap/ui/foo.js",
			"/base/src/main/js/sap/ui/foo.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/src/main/test-resources/sap/ui/foo/test.js",
			"/base/src/test/js/sap/ui/foo/test.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/src/test/resources/sap/ui/foo.js",
			"/base/src/main/js/sap/ui/foo.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/src/test/test-resources/sap/ui/foo/test.js",
			"/base/src/test/js/sap/ui/foo/test.js"
		]);
	});

	it("Should not rewrite unrelated urls for library", () => {
		const middleware = new Middleware();
		middleware.config = {
			ui5: {
				type: "library",
				paths: {
					src: "src/main/js",
					test: "src/test/js"
				}
			}
		};
		assertRewriteUrlBefore(middleware, [
			"/context.html",
			"/context.html"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/foo.js",
			"/base/foo.js"
		]);
	});

	it("Should not rewrite url when no type is given", () => {
		const middleware = new Middleware();

		assertRewriteUrlBefore(middleware, [
			"/base/resources/sap/ui/foo/library.js",
			"/base/resources/sap/ui/foo/library.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/test-resources/sap/ui/foo/test.js",
			"/base/test-resources/sap/ui/foo/test.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/src/main/resources/sap/ui/foo.js",
			"/base/src/main/resources/sap/ui/foo.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/src/main/test-resources/sap/ui/foo/test.js",
			"/base/src/main/test-resources/sap/ui/foo/test.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/src/test/resources/sap/ui/foo.js",
			"/base/src/test/resources/sap/ui/foo.js"
		]);
		assertRewriteUrlBefore(middleware, [
			"/base/src/test/test-resources/sap/ui/foo/test.js",
			"/base/src/test/test-resources/sap/ui/foo/test.js"
		]);
	});

	/*
	it("Should throw error when invalid type is given", () => {
		framework.config.ui5.type = "foo";

		const loggerSpy = jest.spyOn(framework.logger, "log");
		framework.rewriteUrlBefore("/foo");
		expect(loggerSpy).toBeCalled();
	});
	*/
});

describe("rewriteUrl", () => {
	const assertRewriteUrl = (middleware, [url, expectedUrl]) => {
		expect(middleware.rewriteUrl(url)).toEqual(expectedUrl);
	};

	it("Should rewrite url for application", () => {
		const middleware = new Middleware();
		middleware.config = {
			ui5: {
				type: "application",
				paths: {
					webapp: "webapp"
				}
			}
		};

		// Good path
		assertRewriteUrl(middleware, [
			"/base/webapp/resources/sap-ui-core.js",
			"/resources/sap-ui-core.js"
		]);
		assertRewriteUrl(middleware, [
			"/base/webapp/test-resources/sap/ui/test/",
			"/test-resources/sap/ui/test/"
		]);
		assertRewriteUrl(middleware, [
			"/base/webapp/foo.js",
			"/foo.js"
		]);

		// Sad path (no rewrite)
		assertRewriteUrl(middleware, [
			"/webapp/resources/sap-ui-core.js",
			"/webapp/resources/sap-ui-core.js"
		]);
		assertRewriteUrl(middleware, [
			"/webapp/test-resources/sap/ui/test/",
			"/webapp/test-resources/sap/ui/test/"
		]);
		assertRewriteUrl(middleware, [
			"/base/resources/sap-ui-core.js",
			"/base/resources/sap-ui-core.js"
		]);
		assertRewriteUrl(middleware, [
			"/base/test-resources/sap/ui/test/",
			"/base/test-resources/sap/ui/test/"
		]);
		assertRewriteUrl(middleware, [
			"/resources/sap-ui-core.js",
			"/resources/sap-ui-core.js"
		]);
		assertRewriteUrl(middleware, [
			"/test-resources/sap/ui/test/",
			"/test-resources/sap/ui/test/"
		]);
	});

	it("Should rewrite url for application with deep webapp path", () => {
		const middleware = new Middleware();
		middleware.config = {
			ui5: {
				type: "application",
				paths: {
					webapp: "src/main/webapp"
				}
			}
		};

		// Good path
		assertRewriteUrl(middleware, [
			"/base/src/main/webapp/resources/sap-ui-core.js",
			"/resources/sap-ui-core.js"
		]);
		assertRewriteUrl(middleware, [
			"/base/src/main/webapp/test-resources/sap/ui/test/",
			"/test-resources/sap/ui/test/"
		]);
		assertRewriteUrl(middleware, [
			"/base/src/main/webapp/foo.js",
			"/foo.js"
		]);

		// Sad path (no rewrite)
		// assertRewriteUrl(middleware, [
		// 	"/webapp/resources/sap-ui-core.js",
		// 	"/webapp/resources/sap-ui-core.js"
		// ]);
		// assertRewriteUrl(middleware, [
		// 	"/webapp/test-resources/sap/ui/test/",
		// 	"/webapp/test-resources/sap/ui/test/"
		// ]);
		// assertRewriteUrl(middleware, [
		// 	"/base/resources/sap-ui-core.js",
		// 	"/base/resources/sap-ui-core.js"
		// ]);
		// assertRewriteUrl(middleware, [
		// 	"/base/test-resources/sap/ui/test/",
		// 	"/base/test-resources/sap/ui/test/"
		// ]);
		// assertRewriteUrl(middleware, [
		// 	"/resources/sap-ui-core.js",
		// 	"/resources/sap-ui-core.js"
		// ]);
		// assertRewriteUrl(middleware, [
		// 	"/test-resources/sap/ui/test/",
		// 	"/test-resources/sap/ui/test/"
		// ]);
	});

	it("Should rewrite url for library", () => {
		const middleware = new Middleware();
		middleware.config = {
			ui5: {
				type: "library",
				paths: {
					src: "src",
					test: "test"
				}
			}
		};

		// Good path
		assertRewriteUrl(middleware, [
			"/base/src/sap-ui-core.js",
			"/resources/sap-ui-core.js"
		]);
		assertRewriteUrl(middleware, [
			"/base/test/sap/ui/test/",
			"/test-resources/sap/ui/test/"
		]);
		// TODO: is this expected? (see code)
		// assertRewriteUrl(middleware, [
		// 	"/base/foo.js",
		// 	"/foo.js"
		// ]);

		// Sad path (no rewrite)
		assertRewriteUrl(middleware, [
			"/src/sap-ui-core.js",
			"/src/sap-ui-core.js"
		]);
		assertRewriteUrl(middleware, [
			"/test/sap/ui/test/",
			"/test/sap/ui/test/"
		]);
		assertRewriteUrl(middleware, [
			"/webapp/resources/sap-ui-core.js",
			"/webapp/resources/sap-ui-core.js"
		]);
		assertRewriteUrl(middleware, [
			"/webapp/test-resources/sap/ui/test/",
			"/webapp/test-resources/sap/ui/test/"
		]);
		assertRewriteUrl(middleware, [
			"/base/resources/sap-ui-core.js",
			"/base/resources/sap-ui-core.js"
		]);
		assertRewriteUrl(middleware, [
			"/base/test-resources/sap/ui/test/",
			"/base/test-resources/sap/ui/test/"
		]);
		assertRewriteUrl(middleware, [
			"/resources/sap-ui-core.js",
			"/resources/sap-ui-core.js"
		]);
		assertRewriteUrl(middleware, [
			"/test-resources/sap/ui/test/",
			"/test-resources/sap/ui/test/"
		]);
	});

	it("Should not rewrite url when no type is given", () => {
		const middleware = new Middleware();

		assertRewriteUrl(middleware, [
			"/base/webapp/resources/sap-ui-core.js",
			"/base/webapp/resources/sap-ui-core.js"
		]);
		assertRewriteUrl(middleware, [
			"/base/webapp/test-resources/sap/ui/test/",
			"/base/webapp/test-resources/sap/ui/test/"
		]);
		assertRewriteUrl(middleware, [
			"/base/webapp/foo.js",
			"/base/webapp/foo.js"
		]);
		assertRewriteUrl(middleware, [
			"/base/src/sap-ui-core.js",
			"/base/src/sap-ui-core.js"
		]);
		assertRewriteUrl(middleware, [
			"/base/test/sap/ui/test/",
			"/base/test/sap/ui/test/"
		]);
		assertRewriteUrl(middleware, [
			"/base/foo.js",
			"/base/foo.js"
		]);
	});

	it("Should throw error when invalid type is given", () => {
		const middleware = new Middleware();
		middleware.config = {
			ui5: {
				type: "foo"
			}
		};
		middleware.logger = {log: jest.fn()};

		middleware.rewriteUrl("/foo");

		expect(middleware.logger.log).toBeCalled();
	});
});

/*
describe("Middleware for UI5", () => {
	it("Should pause requests during UI5 server setup and resume once ready", (done) => {
		const config = {
			ui5: {
				useMiddleware: true
			}
		};
		const framework = new Framework();
		framework.exists = () => true;
		framework.init({config, logger});

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
				type: "application",
				useMiddleware: true
			}
		};
		const framework = new Framework();
		framework.exists = () => true;
		framework.init({config, logger});
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
		const framework = new Framework();
		framework.exists = () => true;
		framework.init({config, logger});
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
		framework.exists = () => true;
		const setupProxySpy = jest.spyOn(framework, "setupProxy");
		const config = {
			ui5: {
				url: "http://localhost",
				type: "application"
			}
		};

		framework.init({config, logger});

		expect(setupProxySpy).toHaveBeenCalledWith({
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

	it.skip("Should setup UI5 tooling middleware if ui5.yaml is present", () => {
		const framework = new Framework();
		framework.exists = () => true;
		const setupUI5Server = jest.spyOn(framework, "setupUI5Server");

		framework.init({config: {}, logger});

		expect(setupUI5Server).toHaveBeenCalledWith(""); // basePath
	});

	// Sad path
	it.skip("Should throw if ui5.yaml is missing and no url is configured", () => {
		const framework = new Framework();

		expect(() => {
			framework.init({config: {}, logger});
		}).toThrow();
	});
});

*/
