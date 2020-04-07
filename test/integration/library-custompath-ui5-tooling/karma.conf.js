module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		ui5: {
			type: "library",
			paths: {
				src: "src/main/js",
				test: "src/test/js"
			}
		},

		frameworks: ["ui5"]

	});
};

module.exports.assertions = function({expect, log}) {
	expect(log).toContain("TOTAL: 1 SUCCESS");
};
