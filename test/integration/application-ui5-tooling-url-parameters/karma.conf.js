module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		frameworks: ["ui5"],
		ui5: {
			urlParameters: [{
				key: "hidepassed",
				value: true
			}, {
				key: 0,
				value: "0️⃣"
			}, {
				key: "0",
				value: ""
			}]
		}

	});
};

module.exports.assertions = function({expect, log}) {
	expect(log).toContain("TOTAL: 1 SUCCESS");
};
