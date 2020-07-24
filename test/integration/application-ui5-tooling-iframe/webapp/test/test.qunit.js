/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	QUnit.test("Karma", function(assert) {
		const done = assert.async();
		window._iframeDone = function() {
			assert.ok(true, "assertion succeeded");
			done();
		};
		const frame = document.createElement("iframe");
		frame.src = "iframepage.html";

		window.document.body.appendChild(frame);
	});

	QUnit.start();
});
