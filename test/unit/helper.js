import test from "ava";

import helper from "../../helper.cjs";

test("Should modify the config if coverageReporter is not set", (t) => {
	const config = {};
	helper.configureIframeCoverage(config);
	t.deepEqual(config, {
		"coverageReporter": {
			"instrumenterOptions": {
				"istanbul": {
					"coverageGlobalScope":
							"(function() { var g=window;while(!g.__karma__&&g!==g.parent){g=g.parent;}; return g; })();"
				}
			}
		}
	});
});

test("Should add coverageReporter", (t) => {
	const config = {
		"coverageReporter": {}
	};
	helper.configureIframeCoverage(config);
	t.deepEqual(config, {
		"coverageReporter": {
			"instrumenterOptions": {
				"istanbul": {
					"coverageGlobalScope":
							"(function() { var g=window;while(!g.__karma__&&g!==g.parent){g=g.parent;}; return g; })();"
				}
			}
		}
	});
});

test("Should overwrite coverageReporter", (t) => {
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
	t.deepEqual(config, {
		"coverageReporter": {
			"instrumenterOptions": {
				"istanbul": {
					"coverageGlobalScope":
							"(function() { var g=window;while(!g.__karma__&&g!==g.parent){g=g.parent;}; return g; })();"
				}
			}
		}
	});
});

