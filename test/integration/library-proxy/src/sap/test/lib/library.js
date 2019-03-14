sap.ui.define(["sap/ui/core/library"], function() {
	"use strict";

	sap.ui.getCore().initLibrary({
		name: "sap.test.lib",
		dependencies: ["sap.ui.core"],
		controls: [],
		elements: [],
		noLibraryCSS: true
	});

	return sap.test.lib;
});
