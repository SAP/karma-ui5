/* global window, parent */

window.suite = function() {
	"use strict";

	// eslint-disable-next-line
	var oSuite = new parent.jsUnitTestSuite(),
		sContextPath = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1);
	oSuite.addTestPage(sContextPath + "test.qunit.html");

	return oSuite;
};
