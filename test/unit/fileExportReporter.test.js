const fs = require("fs").promises;
const path = require("path");

jest.mock("mkdirp", () => jest.fn());
const mkdirp = require("mkdirp");
const FileExportReporter = require("../../lib/fileExportReporter");

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
		basePath: resolvedTestPath,
		ui5: {
			fileExport: {
				outputDir: "myFileExportDir"
			}
		}
	};
	const configNoDir = {
		basePath: resolvedTestPath,
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

	it("Reading outputDir from config", async () => {
		pathJoinMock
			.mockReturnValueOnce(resolvedTestPath + "/path1")
			.mockReturnValueOnce(resolvedTestPath + "/path2");

		const fileExportReporter = new FileExportReporter(base, config, logger);
		const fileExportReporterDefaultPath = new FileExportReporter(base, configNoDir, logger);

		expect(base).toBeCalledWith(fileExportReporter);
		expect(base).toBeCalledWith(fileExportReporterDefaultPath);

		expect(pathJoinMock).toHaveBeenCalledTimes(2);
		expect(pathJoinMock).toBeCalledWith(resolvedTestPath, "./karma-ui5-reports");
		expect(pathJoinMock).toBeCalledWith(resolvedTestPath, "myFileExportDir");

		expect(log.debug).toHaveBeenCalledTimes(2);
		expect(log.debug).toBeCalledWith("outputDir is: " + resolvedTestPath + "/path1");
		expect(log.debug).toBeCalledWith("outputDir is: " + resolvedTestPath + "/path2");
	});

	it("onBrowserComplete - no files provided", async () => {
		const browser = {};
		const result = {
			exportFiles: null
		};

		const fileExportReporter = new FileExportReporter(base, config, logger);
		fileExportReporter.onBrowserComplete(browser, result);

		expect(log.debug).toBeCalledWith("No export files provided");
	});

	it("onBrowserComplete - tests crashed", async () => {
		const browser = {};

		const fileExportReporter = new FileExportReporter(base, config, logger);
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
				name: "/some/path/filename2", // prevent using deeper path structures
				content: "content2"
			}]
		};

		pathJoinMock
			.mockReturnValueOnce(resolvedTestPath)
			.mockReturnValueOnce(filePath1)
			.mockReturnValueOnce(filePath2);
		fsAccessMock
			.mockRejectedValueOnce({code: "ENOENT"})
			.mockRejectedValueOnce({code: "ENOENT"});
		fsWriteFileMock
			.mockResolvedValueOnce() // first file: success
			.mockRejectedValueOnce(new Error("errorMsg")); // second file: failed

		const fileExportReporter = new FileExportReporter(base, config, logger);
		await fileExportReporter.onBrowserComplete(browser, result);

		expect(mkdirp).toHaveBeenCalledTimes(2);
		expect(mkdirp).toBeCalledWith("./karma-ui5-reports");

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
		const browser2 = {name: "/some/path/BrowserB"}; // prevent using deeper path structures
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
			.mockReturnValueOnce(resolvedTestPath)
			.mockReturnValueOnce("/BrowserA/filename1")
			.mockReturnValueOnce("/BrowserB/filename2");
		fsAccessMock
			.mockRejectedValueOnce({code: "ENOENT"})
			.mockRejectedValueOnce({code: "ENOENT"});
		fsWriteFileMock
			.mockResolvedValueOnce()
			.mockResolvedValueOnce();

		const configInclBrowsers = Object.assign({browsers: ["A", "B"]}, config);
		const fileExportReporter = new FileExportReporter(base, configInclBrowsers, logger);
		await fileExportReporter.onBrowserComplete(browser1, result1);
		await fileExportReporter.onBrowserComplete(browser2, result2);

		expect(pathJoinMock).toHaveBeenCalledTimes(3);
		expect(pathJoinMock).toBeCalledWith(resolvedTestPath, "myFileExportDir"); // outputDir creation
		expect(pathJoinMock).toBeCalledWith(resolvedTestPath, "BrowserA", "filename1");
		expect(pathJoinMock).toBeCalledWith(resolvedTestPath, "BrowserB", "filename2");

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
			.mockReturnValueOnce(resolvedTestPath)
			.mockReturnValueOnce(filePath)
			.mockReturnValueOnce(filePath)
			.mockReturnValueOnce(filePath);
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

		const fileExportReporter = new FileExportReporter(base, config, logger);
		await fileExportReporter.onBrowserComplete(browser, result);

		expect(fsWriteFileMock).toHaveBeenCalledTimes(3);
		expect(fsWriteFileMock).toBeCalledWith("./karma-ui5-reports/filename", "content1");
		expect(fsWriteFileMock).toBeCalledWith("./karma-ui5-reports/filename_1", "content2");
		expect(fsWriteFileMock).toBeCalledWith("./karma-ui5-reports/filename_2", "content3");
	});
});
