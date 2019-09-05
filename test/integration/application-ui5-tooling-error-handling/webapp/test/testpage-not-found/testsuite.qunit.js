window.suite = function() {
	"use strict";

	// eslint-disable-next-line new-cap
	const oSuite = new parent.jsUnitTestSuite();
	oSuite.addTestPage("/does/not/exist.qunit.html");

	return oSuite;
};
