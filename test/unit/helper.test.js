const helper = require("../../helper");


describe("helper for config", () => {
	it("Should not modify the config if coverageReporter is not set", async () => {
		const config = {};
		helper.configureIframeCoverage(config);
		expect(config).toStrictEqual({});
	});

	it("Should add coverageReporter", async () => {
		const config = {
			"coverageReporter": {}
		};
		helper.configureIframeCoverage(config);
		expect(config).toStrictEqual({
			"coverageReporter": {
				"instrumenterOptions": {
					"istanbul": {
						"coverageGlobalScope": "(function() { var g=window;while(!g.__karma__&&g!==g.parent){g=g.parent;}; return g; })();"
					}
				}
			}
		});
	});

	it("Should not modify coverageReporter", async () => {
		const config = {
			"coverageReporter": {
				"instrumenterOptions": {
					"istanbul": {
						"coverageGlobalScope": "mytest"
					}
				}
			}
		};
		helper.configureIframeCoverage(config);
		expect(config).toStrictEqual({
			"coverageReporter": {
				"instrumenterOptions": {
					"istanbul": {
						"coverageGlobalScope": "mytest"
					}
				}
			}
		});
	});
});
