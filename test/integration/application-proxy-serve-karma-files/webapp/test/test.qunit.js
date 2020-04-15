/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	sap.ui.require(["test/app/foo"], function(foo) {
		QUnit.test("Version placeholder", function(assert) {
			assert.equal(foo, "1.0.0");
		});

		QUnit.test("Properties file non ASCII escaping", function(assert) {
			const done = assert.async();
			const xhr = new XMLHttpRequest();
			xhr.open("GET", "../foo.properties", true);
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) {
					assert.equal(xhr.responseText, "YAY=\\u00f0\\u009f\\u00a5\\u00b3\n");
					done();
				}
			};
			xhr.send(null);
		});

		QUnit.start();
	});
});
