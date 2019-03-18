(function(window) {
	const config = window.__karma__.config;
	const ui5config = (config && config.ui5) || {};
	const bootstrapConfig = ui5config.config || {};

	window["sap-ui-config"] = bootstrapConfig;
})(window);
