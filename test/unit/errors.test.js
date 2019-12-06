const {ErrorMessage} = require("../../lib/errors");

describe("multipleFrameworks", () => {
	it("should return message with no framework", () => {
		expect(ErrorMessage.multipleFrameworks([])).toBe(`error 1:
The "karma-ui5" plugin is not compatible with other framework plugins when running in "html" mode.
Please make sure to define "ui5" as the only framework in your karma config:

module.exports = function(config) {
	config.set({
		frameworks: ["ui5"]
	});
};
`);
	});
	it("should return message with qunit framework", () => {
		expect(ErrorMessage.multipleFrameworks(["qunit"])).toBe(`error 1:
The "karma-ui5" plugin is not compatible with other framework plugins when running in "html" mode.
QUnit is supported out of the box.
Please make sure to define "ui5" as the only framework in your karma config:

module.exports = function(config) {
	config.set({
		frameworks: ["ui5"]
	});
};
`);
	});
	it("should return message with sinon framework", () => {
		expect(ErrorMessage.multipleFrameworks(["sinon"])).toBe(`error 1:
The "karma-ui5" plugin is not compatible with other framework plugins when running in "html" mode.
Sinon should be loaded from the test.
Please make sure to define "ui5" as the only framework in your karma config:

module.exports = function(config) {
	config.set({
		frameworks: ["ui5"]
	});
};
`);
	});
	it("should return message with qunit and sinon frameworks", () => {
		expect(ErrorMessage.multipleFrameworks(["qunit", "sinon"])).toBe(`error 1:
The "karma-ui5" plugin is not compatible with other framework plugins when running in "html" mode.
QUnit is supported out of the box.
Sinon should be loaded from the test.
Please make sure to define "ui5" as the only framework in your karma config:

module.exports = function(config) {
	config.set({
		frameworks: ["ui5"]
	});
};
`);
	});
});
