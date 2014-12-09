var config = window.__karma__.config,
	ui5config = (config && config.openui5) || {},
	bootstrapConfig = ui5config.config || {};

if (!bootstrapConfig.theme) {
	bootstrapConfig.theme = "sap_bluecrystal";
}
window["sap-ui-config"] = bootstrapConfig;
