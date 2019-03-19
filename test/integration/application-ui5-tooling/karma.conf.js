module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		ui5: {
			type: "application"
		},

		frameworks: ["ui5"],

		plugins: [
			require("../../../lib"),
			require("karma-chrome-launcher")
		],

		browsers: ["Chrome"],
		singleRun: true

	});
};
