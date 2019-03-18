module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		ui5: {
			type: "library",
			url: "https://openui5nightly.hana.ondemand.com"
		},

		frameworks: ["ui5"],

		plugins: [
			require("../../../lib"),
			require("karma-chrome-launcher")
		]

	});
};
