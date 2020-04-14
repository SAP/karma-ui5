const {ErrorMessage} = require("./errors");

module.exports = {
	applyDefaults: (config) => {
		config.basePath = config.basePath || "";
		config.client = config.client || {};
		config.client.clearContext = false;
		// Always override client ui5 config. It should not be used by consumers.
		// Relevant options (e.g. testpage, config, tests) will be written to the client section.
		config.client.ui5 = {};
		config.client.ui5.useIframe = true; // for now only allow using iframes in HTML mode
		config.ui5 = config.ui5 || {};
		config.files = config.files || [];

		if (!config.ui5.mode) {
			config.ui5.mode = "html";
		}

		config.beforeMiddleware = config.beforeMiddleware || [];
		config.beforeMiddleware.push("ui5--beforeMiddleware");

		config.middleware = config.middleware || [];
		config.middleware.push("ui5--middleware");
	},
	validate: function(config, log) {
		// Check for legacy karma-openui5 settings
		if (config.openui5 || config.client.openui5) {
			log.error(ErrorMessage.migrateConfig());
			throw new Error(ErrorMessage.failure());
		}

		if (config.ui5.mode && ["script", "html"].indexOf(config.ui5.mode) === -1) {
			log.error(ErrorMessage.invalidMode(config.ui5.mode));
			throw new Error(ErrorMessage.failure());
		}

		const blacklistedFrameworks = ["qunit", "sinon"];
		const hasBlacklistedFrameworks = (frameworks) => frameworks.some((fwk) => blacklistedFrameworks.includes(fwk));
		if (config.ui5.mode === "html" && hasBlacklistedFrameworks(config.frameworks || [])) {
			log.error(ErrorMessage.blacklistedFrameworks(config.frameworks) );
			throw new Error(ErrorMessage.failure());
		}

		if (config.ui5.mode === "html" && config.files.length > 0) {
			log.error(ErrorMessage.containsFilesDefinition() );
			throw new Error(ErrorMessage.failure());
		}

		if (config.ui5.paths && !config.ui5.type) {
			log.error(ErrorMessage.customPathWithoutType() );
			throw new Error(ErrorMessage.failure());
		}

		if (config.ui5.mode !== "html" && config.ui5.urlParameters) {
			log.error(ErrorMessage.urlParametersConfigInNonHtmlMode(config.ui5.mode,
				config.ui5.urlParameters));
			throw new Error(ErrorMessage.failure());
		}

		if (config.ui5.urlParameters !== undefined && !Array.isArray(config.ui5.urlParameters)) {
			log.error(ErrorMessage.urlParametersNotAnArray(config.ui5.urlParameters));
			throw new Error(ErrorMessage.failure());
		}

		if (config.ui5.urlParameters) {
			config.ui5.urlParameters.forEach((urlParameter) => {
				if (typeof urlParameter !== "object") {
					log.error(ErrorMessage.urlParameterNotObject(urlParameter));
					throw new Error(ErrorMessage.failure());
				}
				if (urlParameter.key === undefined || urlParameter.value === undefined) {
					log.error(ErrorMessage.urlParameterMissingKeyOrValue(urlParameter));
					throw new Error(ErrorMessage.failure());
				}
			});
		}
	}
};
