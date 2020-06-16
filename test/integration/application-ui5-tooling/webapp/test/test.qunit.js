/* global QUnit jQuery */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	sap.ui.require(["test/app/foo"], function() {
		QUnit.test("Karma", function(assert) {
			// query empty file
			return jQuery.ajax("./empty.js").then(function() {
				assert.ok(parent.__karma__.files["/base/webapp/.dotfile"], "Karma files should contain dotfiles");
			}, function(xhr, status, e) {
				assert.ok(false, "Failure: " + e + ", response: " +xhr.responseText);
			});
		});

		QUnit.start();
	});
});
