module.exports = {
	Message: {
		genericProposal: "err 0x01: Please migrate your configuration https://github.com/SAP/karma-ui5",
		genericFailure: "ui5.framework failed. See error message above",
		incompatible: `The "karma-ui5" plugin is not compatible with other framework plugins when running in "html" mode.`,
		incompatibleProposal: `\n
Please make sure to define "ui5" as the only framework in your karma config:

module.exports = function(config) {
	config.set({
		frameworks: ["ui5"],
	});
};`,
		removeQunit: `QUnit is supported out of the box. Please remove it from the configuration`,

		removeSinon: `Sinon should be loaded from the test. Please remove it from the configration.`,

		multipleFrameworks: `Please make sure to define "ui5" as the only framework in your karma config:

module.exports = function(config) {
	config.set({

		frameworks: ["ui5"],

	});
};`,
		urlRewriteFailed: (type) => `Failed to rewrite url. The type "${type}" is not supported.
Please use "library" or "application" as type.

module.exports = function(config) {
	config.set({

		ui5: {
			type: "${type}"\t<-- Invalid. Must be "application" or "library"
		}

	});
};`
	}
}