/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	QUnit.test("sap.test.lib", function(assert) {
		assert.ok(sap.ui.getCore().getLoadedLibraries()["sap.test.lib"], "Library has been loaded");
	});

	QUnit.start();
});
