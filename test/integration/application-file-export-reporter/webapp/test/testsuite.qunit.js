window.suite = function() {
	"use strict";

	// eslint-disable-next-line new-cap
	const oSuite = new parent.jsUnitTestSuite();
	const sContextPath = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1);
	oSuite.addTestPage(sContextPath + "app.qunit.html");
	oSuite.addTestPage(sContextPath + "lib.qunit.html");

	return oSuite;
};
