/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	QUnit.test("Karma", function(assert) {
		assert.ok(parent.__karma__.files["/base/webapp/.dotfile"], "Karma files should contain dotfiles");
	});

	QUnit.start();
});
