describe("Karma Plugin", () => {
	it("Should export framework:ui5", async () => {
		const plugin = require("../../");
		expect(plugin["framework:ui5"]).toStrictEqual(expect.any(Array));
		expect(plugin["framework:ui5"]).toHaveLength(2);
		expect(plugin["framework:ui5"][0]).toBe("factory");
		expect(plugin["framework:ui5"][1]).toStrictEqual(expect.any(Function));
		expect(plugin["framework:ui5"][1].$inject).toStrictEqual(["config", "logger"]);
	});
	it("Should export middleware:ui5--beforeMiddleware", async () => {
		const plugin = require("../../");
		expect(plugin["middleware:ui5--beforeMiddleware"]).toStrictEqual(expect.any(Array));
		expect(plugin["middleware:ui5--beforeMiddleware"]).toHaveLength(2);
		expect(plugin["middleware:ui5--beforeMiddleware"][0]).toBe("factory");
		expect(plugin["middleware:ui5--beforeMiddleware"][1]).toStrictEqual(expect.any(Function));
		expect(plugin["middleware:ui5--beforeMiddleware"][1].$inject).toStrictEqual(["config.ui5"]);
	});
	it("Should export middleware:ui5--middleware", async () => {
		const plugin = require("../../");
		expect(plugin["middleware:ui5--middleware"]).toStrictEqual(expect.any(Array));
		expect(plugin["middleware:ui5--middleware"]).toHaveLength(2);
		expect(plugin["middleware:ui5--middleware"][0]).toBe("factory");
		expect(plugin["middleware:ui5--middleware"][1]).toStrictEqual(expect.any(Function));
		expect(plugin["middleware:ui5--middleware"][1].$inject).toStrictEqual(["config.ui5"]);
	});
	it("Should be able to initialize multiple times", async () => {
		const Framework = require("../../lib/framework");
		const plugin = require("../../");
		const frameworkInitStub = jest.spyOn(Framework.prototype, "init").mockImplementation();

		const config1 = {};
		const logger1 = {
			create: jest.fn(() => {
				return {
					log: jest.fn()
				};
			})
		};

		await plugin["framework:ui5"][1](config1, logger1);

		expect(frameworkInitStub).toHaveBeenCalledTimes(1);
		expect(frameworkInitStub).toHaveBeenCalledWith({config: config1, logger: logger1});

		const config2 = {};
		const logger2 = {
			create: jest.fn(() => {
				return {
					log: jest.fn()
				};
			})
		};

		await plugin["framework:ui5"][1](config2, logger2);

		expect(frameworkInitStub).toHaveBeenCalledTimes(2);
		expect(frameworkInitStub).toHaveBeenCalledWith({config: config2, logger: logger2});
	});
});
