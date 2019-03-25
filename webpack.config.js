const path = require("path");
const LicenseWebpackPlugin = require("license-webpack-plugin").LicenseWebpackPlugin;
const allowedLicenses = [
	"MIT",
	"BSD-3-Clause"
];

module.exports = {
	mode: "production",
	entry: {
		"browser-bundle": "./lib/client/browser.js"
	},
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "browser-bundle.js"
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
