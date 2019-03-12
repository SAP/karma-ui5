module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		ui5: {
			type: "library",
			url: "https://openui5nightly.hana.ondemand.com",
			paths: {
				src: "src/main/js",
				test: "src/test/js"
			}
		},

		frameworks: ["ui5"],

		plugins: [
			require("../../../"),
			require("karma-chrome-launcher")
		]

	});
};
