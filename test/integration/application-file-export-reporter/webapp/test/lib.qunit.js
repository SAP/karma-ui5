/* global QUnit */
sap.ui.require(["test/app/foo"], function(foo) {
	QUnit.test("file export", function(assert) {
		window._$files.push({
			name: "file2.json",
			content: JSON.stringify({data: "foobarbaz"})
		});
		assert.equal(foo, "foo", "Passed");
	});
});
