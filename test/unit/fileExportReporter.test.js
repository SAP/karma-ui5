const FileExportReporter = require("../../lib/fileExportReporter");

const fs = require("fs").promises;
const path = require("path");

describe("fileExportReporter plugin", () => {
	let fsAccessMock;
	let fsWriteFileMock;
	let pathJoinMock;
	beforeEach(() => {
		fsAccessMock = jest.spyOn(fs, "access");
		fsWriteFileMock = jest.spyOn(fs, "writeFile");
		pathJoinMock = jest.spyOn(path, "join");
	});
	afterEach(() => {
		fsAccessMock.mockRestore();
		fsWriteFileMock.mockRestore();
		pathJoinMock.mockRestore();
	});

	const base = jest.fn();
	const resolvedTestPath = "x://some/path/myFileExportDir";
	const config = {
		basePath: "somepath",
		ui5: {
			fileExport: {
				outputDir: "myFileExportDir"
			}
		}
	};
	const configNoDir = {
		basePath: "somepath",
		ui5: {
			fileExport: true
		}
	};
	const log = {
		info: jest.fn(),
		warn: jest.fn(),
		debug: jest.fn()
	};
	const logger = {
		create: jest.fn(() => {
			return log;
		})
	};
	const helper = {
		mkdirIfNotExists: function(path, callback) {
			callback();
		},
		normalizeWinPath: jest.fn()
	};

	helper.normalizeWinPath.mockImplementation(() => resolvedTestPath);

	const fileExportReporter = new FileExportReporter(base, config, logger, helper);
	const fileExportReporterDefaultPath = new FileExportReporter(base, configNoDir, logger, helper);

	it("Reading outputDir from config", async () => {
		expect(base).toBeCalledWith(fileExportReporter);
		expect(base).toBeCalledWith(fileExportReporterDefaultPath);
		expect(log.debug).toBeCalledWith("outputDir is: " + resolvedTestPath + path.sep);
		expect(log.debug).toHaveBeenCalledTimes(2);
	});

	it("onBrowserComplete - no files provided", async () => {
		const browser = {};
		const result = {
			exportFiles: null
		};

		fileExportReporter.onBrowserComplete(browser, result);

		expect(log.debug).toBeCalledWith("No export files provided");
	});

	it("onBrowserComplete - tests crashed", async () => {
		const browser = {};

		fileExportReporter.onBrowserComplete(browser, null);

		expect(log.debug).toBeCalledWith("skipped due to incomplete test run.");
	});

	it("onBrowserComplete - save incoming export files", async () => {
		const browser = {};
		const filePath1 = "./karma-ui5-reports/filePath1";
		const filePath2 = "./karma-ui5-reports/filePath2";
		const result = {
			exportFiles: [{
				name: "filename1",
				content: "content1"
			}, {
				name: "filename2",
				content: "content2"
			}]
		};

		pathJoinMock
			.mockImplementationOnce(() => filePath1)
			.mockImplementationOnce(() => filePath2);
		fsAccessMock
			.mockRejectedValueOnce({code: "ENOENT"})
			.mockRejectedValueOnce({code: "ENOENT"});
		fsWriteFileMock
			.mockResolvedValueOnce() // first file: success
			.mockRejectedValueOnce(new Error("errorMsg")); // second file: failed

		await fileExportReporter.onBrowserComplete(browser, result);

		expect(fsWriteFileMock).toHaveBeenCalledTimes(2);
		expect(fsWriteFileMock).toBeCalledWith(filePath1, "content1");
		expect(fsWriteFileMock).toBeCalledWith(filePath2, "content2");

		expect(log.info).toBeCalledWith("Writing file: " + filePath1);
		expect(log.info).toBeCalledWith("Saved file '" + filePath1 + "'");
		expect(log.info).toBeCalledWith("Writing file: " + filePath2);
		expect(log.warn).toBeCalledWith("Failed to write file\n\terrorMsg");
	});

	it("onBrowserComplete - save incoming export files (different browsers)", async () => {
		const browser1 = {name: "BrowserA"};
		const browser2 = {name: "BrowserB"};
		const result1 = {
			exportFiles: [{
				name: "filename1",
				content: "content1"
			}]
		};
		const result2 = {
			exportFiles: [{
				name: "filename2",
				content: "content2"
			}]
		};

		pathJoinMock
			.mockReturnValueOnce("/BrowserA/filename1")
			.mockReturnValueOnce("/BrowserB/filename2");
		fsAccessMock
			.mockRejectedValueOnce({code: "ENOENT"})
			.mockRejectedValueOnce({code: "ENOENT"});
		fsWriteFileMock
			.mockResolvedValueOnce()
			.mockResolvedValueOnce();

		const configInclBrowsers = Object.assign({browsers: ["A", "B"]}, config);
		const fileExportReporter = new FileExportReporter(base, configInclBrowsers, logger, helper);
		await fileExportReporter.onBrowserComplete(browser1, result1);
		await fileExportReporter.onBrowserComplete(browser2, result2);

		expect(pathJoinMock).toHaveBeenCalledTimes(2);
		expect(pathJoinMock).toBeCalledWith(resolvedTestPath + path.sep, "BrowserA", "filename1");
		expect(pathJoinMock).toBeCalledWith(resolvedTestPath + path.sep, "BrowserB", "filename2");

		expect(fsWriteFileMock).toHaveBeenCalledTimes(2);
		expect(fsWriteFileMock).toBeCalledWith("/BrowserA/filename1", "content1");
		expect(fsWriteFileMock).toBeCalledWith("/BrowserB/filename2", "content2");
	});

	it("onBrowserComplete - save incoming export files (ensure unique file names)", async () => {
		const browser = {};
		const filePath = "./karma-ui5-reports/filename";
		const result = {
			exportFiles: [{
				name: "filename",
				content: "content1"
			}, {
				name: "filename",
				content: "content2"
			}, {
				name: "filename",
				content: "content3"
			}]
		};

		pathJoinMock
			.mockImplementationOnce(() => filePath)
			.mockImplementationOnce(() => filePath)
			.mockImplementationOnce(() => filePath);
		fsAccessMock
			// file 1
			.mockRejectedValueOnce({code: "ENOENT"})
			// file 2
			.mockResolvedValueOnce()
			.mockRejectedValueOnce({code: "ENOENT"})
			// file 3
			.mockResolvedValueOnce()
			.mockResolvedValueOnce()
			.mockRejectedValueOnce({code: "ENOENT"});
		fsWriteFileMock
			.mockResolvedValueOnce()
			.mockResolvedValueOnce()
			.mockResolvedValueOnce();

		await fileExportReporter.onBrowserComplete(browser, result);

		expect(fsWriteFileMock).toHaveBeenCalledTimes(3);
		expect(fsWriteFileMock).toBeCalledWith("./karma-ui5-reports/filename", "content1");
		expect(fsWriteFileMock).toBeCalledWith("./karma-ui5-reports/filename_1", "content2");
		expect(fsWriteFileMock).toBeCalledWith("./karma-ui5-reports/filename_2", "content3");
	});
});
