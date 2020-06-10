/**
 * Enables coverage reporting when an iframe is used.
 *
 * Will set/overwrite the config option:
 * - config.coverageReporter.instrumenterOptions.istanbul.coverageGlobalScope
 *
 * @param {object} config karma configuration object
 */
const configureIframeCoverage = (config) => {
	// set the coverageGlobalScope
	config.coverageReporter = config.coverageReporter || {};
	config.coverageReporter.instrumenterOptions = config.coverageReporter.instrumenterOptions || {};
	config.coverageReporter.instrumenterOptions.istanbul = config.coverageReporter.instrumenterOptions.istanbul || {};
	config.coverageReporter.instrumenterOptions.istanbul.coverageGlobalScope =
		"(function() { var g=window;while(!g.__karma__&&g!==g.parent){g=g.parent;}; return g; })();";
};

module.exports = {
	configureIframeCoverage
};
