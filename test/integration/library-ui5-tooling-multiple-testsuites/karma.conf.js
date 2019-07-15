module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		frameworks: ["ui5"],

		ui5: {
			testpage: "test/sap/test/lib/qunit/testsuite.qunit.html"
		}

	});
};
