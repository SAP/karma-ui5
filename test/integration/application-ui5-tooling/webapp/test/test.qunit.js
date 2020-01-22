/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	sap.ui.require(["test/app/foo"], function() {

		// (function() { var g=this;while(!g.__karma__&&g!==g.parent){g=g.parent;}; return g; })();


		QUnit.test("Karma", function(assert) {
			assert.ok(parent.__karma__.files["/base/webapp/.dotfile"], "Karma files should contain dotfiles");
		});

		QUnit.start();
	});
});
