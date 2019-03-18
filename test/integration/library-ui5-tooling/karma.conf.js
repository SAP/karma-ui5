module.exports = function(config) {
	"use strict";

	require("../karma-base.conf")(config);
	config.set({

		frameworks: ['ui5'],

		plugins: [
			require("../../../lib"),
			require("karma-chrome-launcher")
		],


	});
};
