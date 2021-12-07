const fs = require("fs").promises;
const path = require("path");

jest.mock("mkdirp", () => jest.fn());
const mkdirp = require("mkdirp");
const FileExportReporter = require("../../lib/fileExportReporter");

describe("fileExportReporter plugin", () => {
	let log;
	let logger;
	let fsAccessMock;
	let fsWriteFileMock;
	let pathJoinMock;
	beforeEach(() => {
		log = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn()
		};
		logger = {
			create: jest.fn(() => {
				return log;
			})
		};

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
	const baseDir = "x://some/path/myFileExportDir";
	const resolvedTestPath = "/resolved/path";
	const config = {
		basePath: baseDir,
		ui5: {
			fileExport: {
				outputDir: "myFileExportDir"
			}
		}
	};
	const configNoDir = {
		basePath: baseDir,
		ui5: {
			fileExport: true
		}
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
		expect(pathJoinMock).toBeCalledWith(baseDir, "./karma-ui5-reports");
		expect(pathJoinMock).toBeCalledWith(baseDir, "myFileExportDir");

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

	it("onBrowserComplete - exportFiles must be an array", async () => {
		const browser = {};
		const result = {
			exportFiles: "foo"
		};

		const fileExportReporter = new FileExportReporter(base, config, logger);
		fileExportReporter.onBrowserComplete(browser, result);

		expect(log.warn).toHaveBeenCalledTimes(1);
		expect(log.warn).toBeCalledWith("Export files must be given as an array");
	});

	it("onBrowserComplete - export file's name and content must be of type string", async () => {
		const browser = {};
		const result = {
			exportFiles: [{
				name: {},
				content: "foo"
			}, {
				name: "foo",
				content: {}
			}]
		};

		const fileExportReporter = new FileExportReporter(base, config, logger);
		fileExportReporter.onBrowserComplete(browser, result);

		expect(log.warn).toHaveBeenCalledTimes(2);
		expect(log.warn).toBeCalledWith("Invalid file object. \"name\" and \"content\" must be strings");
		expect(log.warn).toBeCalledWith("Invalid file object. \"name\" and \"content\" must be strings");
	});

	it("onBrowserComplete - tests crashed", async () => {
		const browser = {};

		const fileExportReporter = new FileExportReporter(base, config, logger);
		fileExportReporter.onBrowserComplete(browser, null);

		expect(log.debug).toBeCalledWith("skipped due to incomplete test run.");
	});

	it("onBrowserComplete - save incoming export files", async () => {
		const browser = {};
		const filePath1 = resolvedTestPath + "/filePath1";
		const filePath2 = resolvedTestPath + "/filePath2";
		const result = {
			exportFiles: [{
				name: "filename1",
				content: "content1"
			}, {
				name: "\\some:*?/path<>|/filename2", // test escapeFileName
				content: "content2"
			}]
		};

		pathJoinMock
			.mockReturnValueOnce(resolvedTestPath) // outputDir
			.mockReturnValueOnce(filePath1) // getUniqueFileName
			.mockReturnValueOnce(filePath1) // pathToWrite
			.mockReturnValueOnce(filePath2) // getUniqueFileName
			.mockReturnValueOnce(filePath2); // pathToWrite
		fsAccessMock
			.mockRejectedValueOnce({code: "ENOENT"})
			.mockRejectedValueOnce({code: "ENOENT"});
		fsWriteFileMock
			.mockResolvedValueOnce() // first file: success
			.mockRejectedValueOnce(new Error("errorMsg")); // second file: failed

		const fileExportReporter = new FileExportReporter(base, config, logger);
		await fileExportReporter.onBrowserComplete(browser, result);

		expect(pathJoinMock).toBeCalledWith(resolvedTestPath, ".some.path.filename2"); // test escapeFileName

		expect(mkdirp).toHaveBeenCalledTimes(2);
		expect(mkdirp).toBeCalledWith(resolvedTestPath);

		expect(fsWriteFileMock).toHaveBeenCalledTimes(2);
		expect(fsWriteFileMock).toBeCalledWith(filePath1, "content1");
		expect(fsWriteFileMock).toBeCalledWith(filePath2, "content2");

		expect(log.debug).toBeCalledWith("Writing file: " + filePath1);
		expect(log.info).toBeCalledWith("Saved file '" + filePath1 + "'");
		expect(log.debug).toBeCalledWith("Writing file: " + filePath2);
		expect(log.warn).toBeCalledWith("Failed to write file " + filePath2 + "\n\terrorMsg");
	});

	it("onBrowserComplete - save incoming export files (different browsers)", async () => {
		const browser1 = {name: "BrowserA"};
		const browser2 = {name: "some:*/path<>/BrowserB"}; // test escapeFileName
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
			.mockReturnValueOnce(resolvedTestPath) // outputDir
			.mockReturnValueOnce(resolvedTestPath + "/BrowserA") // outputDir + browser
			.mockReturnValueOnce(resolvedTestPath + "/BrowserA/filename1") // getUniqueFileName
			.mockReturnValueOnce(resolvedTestPath + "/BrowserA/filename1") // pathToWrite
			.mockReturnValueOnce(resolvedTestPath + "/some.path.BrowserB") // outputDir + browser
			.mockReturnValueOnce(resolvedTestPath + "/some.path.BrowserB/filename2") // getUniqueFileName
			.mockReturnValueOnce(resolvedTestPath + "/some.path.BrowserB/filename2"); // pathToWrite
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

		expect(pathJoinMock).toHaveBeenCalledTimes(7);
		expect(pathJoinMock).toBeCalledWith(baseDir, "myFileExportDir"); // outputDir
		expect(pathJoinMock).toBeCalledWith(resolvedTestPath, "BrowserA"); // outputDir + browser
		expect(pathJoinMock).toBeCalledWith(resolvedTestPath + "/BrowserA", "filename1");
		expect(pathJoinMock).toBeCalledWith(resolvedTestPath, "some.path.BrowserB"); // outputDir + browser
		expect(pathJoinMock).toBeCalledWith(resolvedTestPath + "/some.path.BrowserB", "filename2");

		expect(fsWriteFileMock).toHaveBeenCalledTimes(2);
		expect(fsWriteFileMock).toBeCalledWith(resolvedTestPath + "/BrowserA/filename1", "content1");
		expect(fsWriteFileMock).toBeCalledWith(resolvedTestPath + "/some.path.BrowserB/filename2", "content2");
	});

	it("onBrowserComplete - save incoming export files (ensure unique file names)", async () => {
		const browser = {};
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
		expect(fsWriteFileMock).toBeCalledWith(expect.stringMatching(/filename$/), "content1");
		expect(fsWriteFileMock).toBeCalledWith(expect.stringMatching(/filename_1$/), "content2");
		expect(fsWriteFileMock).toBeCalledWith(expect.stringMatching(/filename_2$/), "content3");
	});

	it("onBrowserComplete - invalid export file path", async () => {
		const result = {
			exportFiles: [{
				name: "../foo/filename",
				content: "content1"
			}]
		};

		pathJoinMock
			.mockReturnValueOnce(resolvedTestPath)
			.mockReturnValueOnce("/resolved/foo/filename")
			.mockReturnValueOnce("/resolved/foo/filename");
		fsAccessMock
			.mockRejectedValueOnce({code: "ENOENT"});
		fsWriteFileMock
			.mockImplementationOnce(() => {});

		const fileExportReporter = new FileExportReporter(base, config, logger);
		await fileExportReporter.onBrowserComplete({}, result);

		expect(fsWriteFileMock).toHaveBeenCalledTimes(0);
		expect(log.warn).toBeCalledWith("Invalid export file path: /resolved/foo/filename\n\t" +
			"Make sure the file path is in directory: " + resolvedTestPath);
	});

	it("onExit - done-function is only called if onBrowserComplete is processed (exitCode=0)", async () => {
		const result = {
			exportFiles: [{
				name: "filename",
				content: "content1"
			}]
		};
		const doneFunction = jest.fn();

		const fileExportReporter = new FileExportReporter(base, config, logger);

		fileExportReporter.onExit(doneFunction);
		expect(doneFunction).toHaveBeenCalledTimes(0); // done-function not yet called

		fsAccessMock.mockRejectedValueOnce({code: "ENOENT"});
		fsWriteFileMock.mockResolvedValueOnce();
		await fileExportReporter.onBrowserComplete({}, result);

		expect(doneFunction).toHaveBeenCalledTimes(1);
		expect(doneFunction).toBeCalledWith(0);
	});

	it("onExit - done-function is only called if onBrowserComplete is processed (exitCode=1)", async () => {
		const result = {
			exportFiles: [{
				name: "filename",
				content: "content1"
			}]
		};
		const doneFunction = jest.fn();

		const fileExportReporter = new FileExportReporter(base, config, logger);

		fileExportReporter.onExit(doneFunction);
		expect(doneFunction).toHaveBeenCalledTimes(0); // done-function not yet called

		fsAccessMock.mockImplementationOnce(() => {
			throw new Error("errorMsg");
		});
		await fileExportReporter.onBrowserComplete({}, result);

		expect(log.error).toBeCalledWith("An unexpected error occured while exporting files\n\terrorMsg");
		expect(doneFunction).toHaveBeenCalledTimes(1);
		expect(doneFunction).toBeCalledWith(1);
	});
});
