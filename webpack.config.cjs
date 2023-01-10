const path = require("path");
const LicenseWebpackPlugin = require("license-webpack-plugin").LicenseWebpackPlugin;
const allowedLicenses = [
	"MIT",
	"BSD-3-Clause"
];

module.exports = {
	mode: "production",
	devtool: false,
	entry: {
		"browser-bundle": "./lib/client/browser.js"
	},
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "browser-bundle.js"
	},
	target: ["web", "es5"],
	module: {
		rules: [
			{
				test: /\.m?js$/,
				use: {
					loader: "babel-loader",
					options: {
						presets: [
							[
								"@babel/preset-env",
								{
									useBuiltIns: "usage", // Add polyfills based on usage in code
									corejs: 3,
									targets: [
										"last 2 iOS major versions",
										"last 2 Safari major versions",
										"IE 11",
										"last 2 Edge versions",
										"last 1 Chrome version",
										"last 1 ChromeAndroid version",
										"last 1 Firefox version",
										"Firefox ESR"
									]
								}
							]
						],
						// Process all files (incl. node_modules)
						// except core-js and webpack for which processing is not required
						ignore: [
							"**/node_modules/core-js/**",
							"**/node_modules/webpack/**"
						],
						// Use "unambiguous" as thirdparty code is unknown
						sourceType: "unambiguous"
					}
				}
			}
		]
	},
	plugins: [
		new LicenseWebpackPlugin({
			addBanner: true,
			unacceptableLicenseTest: (licenseType) => {
				// Fail when not allowed licenses would be packaged
				return !allowedLicenses.includes(licenseType);
			},
			renderLicenses: (modules) => {
				const line = (v) => v ? `\n${v}` : "";
				return modules
					.sort((a, b) => a.name < b.name ? -1 : 1)
					.map((module) => {
						let text = `${module.name} (${module.packageJson.version})`;
						text += line(module.packageJson.homepage);
						text += line(module.licenseId);
						text += line(module.licenseText);
						return text;
					}).join("\n\n");
			}
		})
	]
};
