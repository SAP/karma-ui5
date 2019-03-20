/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	QUnit.test("Karma", function(assert) {
		assert.ok(parent.__karma__.files["/base/src/sap/test/lib/.library"], "Karma src files should contain dotfiles");
		assert.ok(parent.__karma__.files["/base/test/.dotfile"], "Karma test files should contain dotfiles");
	});

	QUnit.test("sap.test.lib", function(assert) {
		assert.ok(sap.ui.getCore().getLoadedLibraries()["sap.test.lib"], "Library has been loaded");
	});

	QUnit.start();
});
