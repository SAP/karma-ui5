module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		ui5: {
			type: "application",
			url: "http://localhost:" + config.localUI5ServerPort,
			fileExport: true
		},

		frameworks: ["ui5"],

		reporters: ["progress"]

	});

	require("../saucelabs").setTestName(config, __filename);
};

module.exports.assertions = function({expect, log}) {
	const exportFile1 = require("./karma-ui5-reports/TEST-test.app-FILE-file1.json");
	const exportFile2 = require("./karma-ui5-reports/TEST-test.app-FILE-file2.json");
	const exportFile3 = require("./karma-ui5-reports/TEST-test.lib-FILE-file1.json");
	const exportFile4 = require("./karma-ui5-reports/TEST-test.lib-FILE-file2.json");
	expect(exportFile1).toEqual({data: "foobar"});
	expect(exportFile2).toEqual({data: "foobarbaz"});
	expect(exportFile3).toEqual({data: "foobar"});
	expect(exportFile4).toEqual({data: "foobarbaz"});
};
