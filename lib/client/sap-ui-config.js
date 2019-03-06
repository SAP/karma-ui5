(function(window) {
	var config = window.__karma__.config,
	ui5config = (config && config.ui5) || {},
	bootstrapConfig = ui5config.config || {};

	window["sap-ui-config"] = bootstrapConfig;
})(window);
