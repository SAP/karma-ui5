const configureIframeCoverage = (config) => {
	// set the coverageGlobalScope
	if (config.coverageReporter) {
		config.coverageReporter.instrumenterOptions = config.coverageReporter.instrumenterOptions || {};
		config.coverageReporter.instrumenterOptions.istanbul = config.coverageReporter.instrumenterOptions.istanbul || {};

		if (!config.coverageReporter.instrumenterOptions.istanbul.coverageGlobalScope) {
			config.coverageReporter.instrumenterOptions.istanbul.coverageGlobalScope = "(function() { var g=window;while(!g.__karma__&&g!==g.parent){g=g.parent;}; return g; })();";
		}
	}
};

module.exports = {
	configureIframeCoverage
};
