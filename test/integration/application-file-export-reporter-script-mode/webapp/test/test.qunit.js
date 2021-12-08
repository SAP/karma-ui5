/* global QUnit */
sap.ui.define(["test/app/foo"], function(foo) {
	QUnit.test("file export script mode", function(assert) {
		window._$files.push({
			name: "file2.json",
			content: JSON.stringify({data: "foobarbaz"})
		});
		window._$files.push({
			name: "file2.json",
			content: JSON.stringify({data: "foobarbaz_1"})
		});
		window._$files.push({
			name: "file2.json",
			content: JSON.stringify({data: "foobarbaz_2"})
		});
		assert.equal(foo, "foo", "Passed");
	});
});
