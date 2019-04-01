/* global QUnit */
sap.ui.define(function() {
	QUnit.test("sap.test.lib", function(assert) {
		assert.ok(sap.ui.getCore().getLoadedLibraries()["sap.test.lib"], "Library has been loaded");
	});
});
