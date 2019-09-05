/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	QUnit.test("URL Parameters", function(assert) {
		assert.strictEqual(document.location.search, encodeURI("?0=0️⃣&0=&hidepassed=true"),
			"Configured URL parameters got applied");
		assert.ok(QUnit.config.hidepassed, "URL parameter configured QUnit");
	});

	QUnit.start();
});
