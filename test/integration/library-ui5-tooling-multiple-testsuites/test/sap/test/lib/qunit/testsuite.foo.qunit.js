/* global window, top, location */

// eslint-disable-next-line sap-no-global-define
window.suite = function() {
	"use strict";

	// eslint-disable-next-line
	var oSuite = new top.jsUnitTestSuite(),
		sContextPath = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1);
	oSuite.addTestPage(sContextPath + "foo/test.qunit.html");

	return oSuite;
};
