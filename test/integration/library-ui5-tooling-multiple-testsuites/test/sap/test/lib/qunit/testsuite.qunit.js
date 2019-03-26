/* global window, top, location */

// eslint-disable-next-line sap-no-global-define
window.suite = function() {
	"use strict";

	// eslint-disable-next-line
	var oSuite = new top.jsUnitTestSuite(),
		sContextPath = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1);
	oSuite.addTestPage(sContextPath + "test.qunit.html");
	oSuite.addTestPage(sContextPath + "testsuite.foo.qunit.html");

	return oSuite;
};
