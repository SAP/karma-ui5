(function(window) {
	const karma = window.__karma__;
	const config = karma.config;
	const ui5config = (config && config.ui5) || {};
	const ui5configTests = ui5config.tests;

	if (!ui5configTests) {
		// No tests defined - skipping autorun...
		// Tests must be loaded manually
		return;
	}

	// Prevent Karma from running prematurely.
	karma.loaded = function() { };

	sap.ui.getCore().attachInit(function() {
		sap.ui.require(ui5configTests, function() {
			// Finally, start Karma to run the tests.
			karma.start();
		});
	});
})(window);
