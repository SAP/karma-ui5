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

	function requireTestsAndStartKarma() {
		sap.ui.require(ui5configTests, function() {
			// Finally, start Karma to run the tests.
			karma.start();
		});
	}

	sap.ui.require(["sap/ui/core/Core"], function(Core) {
		if (typeof Core.ready === "function") {
			// Available since 1.118
			Core.ready(requireTestsAndStartKarma);
		} else {
			// Deprecated as of 1.118 and removed in 2.x
			// Still relevant for older versions such as 1.71
			Core.attachInit(requireTestsAndStartKarma);
		}
	});
})(window);
