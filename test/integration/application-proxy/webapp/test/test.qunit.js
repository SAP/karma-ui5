/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	QUnit.test("Karma", function(assert) {
		assert.ok(parent.__karma__.files["/base/webapp/.dotfile"], "Karma files should contain dotfiles");
	});

	QUnit.test(
		"Loading files during a test should not result into 'Introduced global variable(s)' issues " +
		"when QUnit.config.noglobals is active",
		function(assert) {
			const done = assert.async();
			sap.ui.require(["test/app/foo"], function() {
				assert.ok(true, "test/app/foo has been loaded");
				done();
			}, function(err) {
				assert.ok(false, "Failed to load test/app/foo: " + err);
			});
		}
	);
	QUnit.config.noglobals = true;

	QUnit.start();
});
