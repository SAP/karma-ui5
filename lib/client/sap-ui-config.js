(function(window) {
	const karma = window.__karma__;
	const config = karma.config;
	const ui5config = (config && config.ui5) || {};
	const bootstrapConfig = ui5config.config || {};

	window["sap-ui-config"] = bootstrapConfig;

	if (ui5config.fileExport) {
		const originalKarmaComplete = karma.complete.bind(karma);
		karma.complete = function(result) {
			if (window._$files) {
				result.exportFiles = window._$files;
			}
			return originalKarmaComplete(result);
		};
	}
})(window);
