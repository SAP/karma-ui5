var config = window.__karma__.config,
		ui5config = (config && config.ui5) || {};

window["sap-ui-config"] = {
	theme: ui5config.theme || "sap_bluecrystal",
	libs: ui5config.libs && ui5config.libs.join(','),
	debug: ui5config.debug || false
};

if (ui5config.resourceRoots) {
	window["sap-ui-config"]["resourceroots"] = ui5config.resourceRoots
}

if (ui5config.bindingSyntax) {
	window["sap-ui-config"]["xx-bindingsyntax"] = ui5config.bindingSyntax
}
