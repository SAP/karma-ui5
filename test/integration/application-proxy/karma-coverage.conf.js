module.exports = function(config) {
	"use strict";

	require("./karma.conf")(config);
	config.set({

		plugins: [
			require("../../../"),
			require("karma-coverage"),
			require("karma-chrome-launcher")
		],

		preprocessors: {
			'{webapp,webapp/!(test)}/*.js': ['coverage']
		},

		coverageReporter: {
			includeAllSources: true,
			reporters: [
				{
					type: 'html',
					dir: 'coverage/'
				},
				{
					type: 'text'
				}
			],
			check: {
				each: {
					statements: 100,
					branches: 100,
					functions: 100,
					lines: 100
				}
			}
		},

		reporters: ['progress', 'coverage'],

	});
};
