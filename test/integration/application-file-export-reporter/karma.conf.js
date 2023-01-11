module.exports = function(config) {
	"use strict";

	require("../karma-base.conf.cjs")(config);
	config.set({

		ui5: {
			type: "application",
			url: "http://localhost:" + config.localUI5ServerPort,
			fileExport: true
		},

		frameworks: ["ui5"],

		reporters: ["progress"]

	});

	require("../saucelabs.cjs").setTestName(config, __filename);
};

module.exports.assertions = function({t, log}) {
	const exportFile1 = require("./karma-ui5-reports/TEST-test.app-FILE-file1.json");
	const exportFile2 = require("./karma-ui5-reports/TEST-test.app-FILE-file2.json");
	const exportFile3 = require("./karma-ui5-reports/TEST-test.lib-FILE-file1.json");
	const exportFile4 = require("./karma-ui5-reports/TEST-test.lib-FILE-file2.json");
	t.deepEqual(exportFile1, {data: "foobar"});
	t.deepEqual(exportFile2, {data: "foobarbaz"});
	t.deepEqual(exportFile3, {data: "foobar"});
	t.deepEqual(exportFile4, {data: "foobarbaz"});
};
