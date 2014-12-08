var config = window.__karma__.config,
		ui5config = (config && config.openui5) || {};

if (!ui5config.theme) {
	ui5config.theme = "sap_bluecrystal";
}
window["sap-ui-config"] = ui5config;
