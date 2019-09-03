/* global window, parent */

window.suite = function() {
	"use strict";

	// eslint-disable-next-line
	var oSuite = new parent.jsUnitTestSuite();

	oSuite.addTestPage("/does/not/exist.qunit.html");

	return oSuite;
};
