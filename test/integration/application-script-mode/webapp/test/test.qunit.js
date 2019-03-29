/* global QUnit */
sap.ui.define(["test/app/foo"], function(foo) {
	QUnit.test("No HTMLRunner Test", function(assert) {
		assert.equal(foo, "foo", "Passed");
	});
});
