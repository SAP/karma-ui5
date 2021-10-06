const CustomFilesReporter = require("../../lib/customFilesReporter");

const pluginName = "CustomFilesReporter";
const fs = require("fs");
const path = require("path");

describe("customFilesReporter plugin", () => {
	let fsWriteFileMock;
	let fsJoinPathsMock;
	beforeEach(() => {
		fsWriteFileMock = jest.spyOn(fs, "writeFile");
		fsJoinPathsMock = jest.spyOn(path, "join");
	});
	afterEach(() => {
		fsWriteFileMock.mockRestore();
		fsJoinPathsMock.mockRestore();
	});

	let base = jest.fn();
	let resolvedTestPath = "x://some/path/myCustomFilesDir";
	let config = {
		basePath: "somepath",
		customFilesReporter: {
			outputDir: "myCustomFilesDir"
		}
	};
	let configNoDir = {
		basePath: "somepath"
	};
	let log = {
		info: jest.fn(),
		warn: jest.fn(),
		debug: jest.fn()
	};
	let logger = {
		create: jest.fn(() => {
			return log;
		})
	};
	let helper = {
		mkdirIfNotExists: function (path, callback) {
			callback();
		},
		normalizeWinPath: jest.fn()
	};

	helper.normalizeWinPath	.mockImplementation(() => resolvedTestPath);

	let customFilesReporter = new CustomFilesReporter(base, config, logger, helper);
	let customFilesReporterDefaultPath = new CustomFilesReporter(base, configNoDir, logger, helper);

	it("Reading outputDir from config", async () => {
		expect(base).toBeCalledWith(customFilesReporter);
		expect(base).toBeCalledWith(customFilesReporterDefaultPath);
		expect(log.debug).toBeCalledWith(pluginName + ": outputDir is: %s", resolvedTestPath + "\\");
		expect(log.debug).toHaveBeenCalledTimes(2);
	});

	it("onBrowserComplete - save incoming custom files", async () => {
		let browser = {};
		let filecontent1 = "content1";
		let filecontent2 = "content2";
		let filePath1 = "filePath1";
		let filePath2 = "filePath2";
		let result = {
			customFiles: [{
				name: "filename1",
				content: filecontent1
			}, {
				name: "filename2",
				content: filecontent2
			}]
		};

		fsJoinPathsMock
			.mockImplementationOnce(() => filePath1)
			.mockImplementationOnce(() => filePath2);

		customFilesReporter.onBrowserComplete(browser, result);

		expect(fsWriteFileMock).toBeCalledWith(filePath1, filecontent1, expect.any(Function));
		expect(fsWriteFileMock).toBeCalledWith(filePath2, filecontent2, expect.any(Function));

		// callback test - success // error
		let callback = fsWriteFileMock.mock.calls[0][2];

		callback();

		expect(log.info).toBeCalledWith(pluginName + ": Saved file '%s'.", filePath1);

		callback({ message : "error"});

		expect(log.warn).toBeCalledWith(pluginName + ": Failed to write file\n\t" + "error");
	});

	it("onBrowserComplete - no files provided", async () => {
		let browser = {};
		let result = {
			customFiles: null
		};

		customFilesReporter.onBrowserComplete(browser, result);

		expect(log.info).toBeCalledWith(pluginName + ": No custom files provided");
	});

	it("onBrowserComplete - tests crashed", async () => {
		let browser = {};

		customFilesReporter.onBrowserComplete(browser, null);

		expect(log.debug).toBeCalledWith(pluginName + ": skipped due to incomplete test run.");
	});
});
