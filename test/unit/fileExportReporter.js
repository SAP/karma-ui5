import test from "ava";
import sinonGlobal from "sinon";
import esmock from "esmock";
import path from "node:path";
import fs from "node:fs/promises";

test.beforeEach(async (t) => {
	const sinon = t.context.sinon = sinonGlobal.createSandbox();

	t.context.mkdirStub = sinon.stub().resolves();
	t.context.fsAccessStub = sinon.stub().callsFake(fs.access);
	t.context.fsWriteFileStub = sinon.stub().callsFake(fs.writeFile);
	t.context.pathJoinStub = sinon.stub().callsFake(path.join);

	t.context.FileExportReporter = await esmock("../../lib/fileExportReporter.js", {
		"node:fs/promises": {
			access: t.context.fsAccessStub,
			writeFile: t.context.fsWriteFileStub,
			mkdir: t.context.mkdirStub
		},
		"node:path": {
			join: t.context.pathJoinStub,
		}
	});

	t.context.log = {
		info: sinon.stub(),
		warn: sinon.stub(),
		error: sinon.stub(),
		debug: sinon.stub()
	};
	t.context.logger = {
		create: sinon.stub().returns(t.context.log)
	};
	t.context.base = sinon.stub();
});

test.afterEach.always((t) => {
	t.context.sinon.restore();
});

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

test("Reading outputDir from config", async (t) => {
	const {FileExportReporter, base, logger, log, pathJoinStub} = t.context;

	pathJoinStub
		.onFirstCall().returns(resolvedTestPath + "/path1")
		.onSecondCall().returns(resolvedTestPath + "/path2");

	const fileExportReporter = new FileExportReporter(base, config, logger);
	const fileExportReporterDefaultPath = new FileExportReporter(base, configNoDir, logger);

	t.is(base.callCount, 2);
	t.deepEqual(base.getCall(0).args, [fileExportReporter]);
	t.deepEqual(base.getCall(1).args, [fileExportReporterDefaultPath]);

	t.is(pathJoinStub.callCount, 2);
	t.deepEqual(pathJoinStub.getCall(0).args, [baseDir, "myFileExportDir"]);
	t.deepEqual(pathJoinStub.getCall(1).args, [baseDir, "./karma-ui5-reports"]);

	t.is(log.debug.callCount, 2);
	t.deepEqual(log.debug.getCall(0).args, ["outputDir is: " + resolvedTestPath + "/path1"]);
	t.deepEqual(log.debug.getCall(1).args, ["outputDir is: " + resolvedTestPath + "/path2"]);
});

test("onBrowserComplete - no files provided", async (t) => {
	const {FileExportReporter, base, logger, log} = t.context;

	const browser = {};
	const result = {
		exportFiles: null
	};

	const fileExportReporter = new FileExportReporter(base, config, logger);
	fileExportReporter.onBrowserComplete(browser, result);

	t.is(log.debug.callCount, 3);
	t.deepEqual(log.debug.getCall(2).args, ["No export files provided"]);
});

test("onBrowserComplete - exportFiles must be an array", async (t) => {
	const {FileExportReporter, base, logger, log} = t.context;

	const browser = {};
	const result = {
		exportFiles: "foo"
	};

	const fileExportReporter = new FileExportReporter(base, config, logger);
	fileExportReporter.onBrowserComplete(browser, result);

	t.is(log.warn.callCount, 1);
	t.deepEqual(log.warn.getCall(0).args, ["Export files must be given as an array"]);
});

test("onBrowserComplete - export file's name and content must be of type string", async (t) => {
	const {FileExportReporter, base, logger, log} = t.context;

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

	t.is(log.warn.callCount, 2);
	t.deepEqual(log.warn.getCall(0).args, ["Invalid file object. \"name\" and \"content\" must be strings"]);
	t.deepEqual(log.warn.getCall(1).args, ["Invalid file object. \"name\" and \"content\" must be strings"]);
});

test("onBrowserComplete - tests crashed", async (t) => {
	const {FileExportReporter, base, logger, log} = t.context;

	const browser = {};

	const fileExportReporter = new FileExportReporter(base, config, logger);
	fileExportReporter.onBrowserComplete(browser, null);

	t.is(log.debug.callCount, 3);
	t.deepEqual(log.debug.getCall(2).args, ["skipped due to incomplete test run."]);
});

test("onBrowserComplete - save incoming export files", async (t) => {
	const {FileExportReporter, base, logger, log, pathJoinStub, fsAccessStub, fsWriteFileStub, mkdirStub} = t.context;

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

	pathJoinStub
		.onCall(0).returns(resolvedTestPath) // outputDir
		.onCall(1).returns(filePath1) // getUniqueFileName
		.onCall(2).returns(filePath1) // pathToWrite
		.onCall(3).returns(filePath2) // getUniqueFileName
		.onCall(4).returns(filePath2); // pathToWrite
	fsAccessStub
		.onCall(0).rejects({code: "ENOENT"})
		.onCall(1).rejects({code: "ENOENT"});
	fsWriteFileStub
		.onCall(0).resolves() // first file: success
		.onCall(1).rejects(new Error("errorMsg")); // second file: failed

	const fileExportReporter = new FileExportReporter(base, config, logger);
	await fileExportReporter.onBrowserComplete(browser, result);

	t.is(pathJoinStub.callCount, 5);
	t.deepEqual(pathJoinStub.getCall(3).args, [resolvedTestPath, ".some.path.filename2"]); // test escapeFileName

	t.is(mkdirStub.callCount, 2);
	t.deepEqual(mkdirStub.getCall(0).args, [resolvedTestPath, {recursive: true}]);

	t.is(fsWriteFileStub.callCount, 2);
	t.deepEqual(fsWriteFileStub.getCall(0).args, [filePath1, "content1"]);
	t.deepEqual(fsWriteFileStub.getCall(1).args, [filePath2, "content2"]);

	t.is(log.debug.callCount, 4);
	t.is(log.info.callCount, 1);
	t.is(log.warn.callCount, 1);
	t.deepEqual(log.debug.getCall(2).args, ["Writing file: " + filePath1]);
	t.deepEqual(log.info.getCall(0).args, ["Saved file '" + filePath1 + "'"]);
	t.deepEqual(log.debug.getCall(3).args, ["Writing file: " + filePath2]);
	t.deepEqual(log.warn.getCall(0).args, ["Failed to write file " + filePath2 + "\n\terrorMsg"]);
});

test("onBrowserComplete - save incoming export files (different browsers)", async (t) => {
	const {FileExportReporter, base, logger, pathJoinStub, fsAccessStub, fsWriteFileStub} = t.context;

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

	pathJoinStub
		.onCall(0).returns(resolvedTestPath) // outputDir
		.onCall(1).returns(resolvedTestPath + "/BrowserA") // outputDir + browser
		.onCall(2).returns(resolvedTestPath + "/BrowserA/filename1") // getUniqueFileName
		.onCall(3).returns(resolvedTestPath + "/BrowserA/filename1") // pathToWrite
		.onCall(4).returns(resolvedTestPath + "/some.path.BrowserB") // outputDir + browser
		.onCall(5).returns(resolvedTestPath + "/some.path.BrowserB/filename2") // getUniqueFileName
		.onCall(6).returns(resolvedTestPath + "/some.path.BrowserB/filename2"); // pathToWrite
	fsAccessStub
		.onCall(0).rejects({code: "ENOENT"})
		.onCall(1).rejects({code: "ENOENT"});
	fsWriteFileStub
		.onCall(0).resolves()
		.onCall(1).resolves();

	const configInclBrowsers = Object.assign({browsers: ["A", "B"]}, config);
	const fileExportReporter = new FileExportReporter(base, configInclBrowsers, logger);
	await fileExportReporter.onBrowserComplete(browser1, result1);
	await fileExportReporter.onBrowserComplete(browser2, result2);

	t.is(pathJoinStub.callCount, 7);
	t.deepEqual(pathJoinStub.getCall(0).args, [baseDir, "myFileExportDir"]); // outputDir
	t.deepEqual(pathJoinStub.getCall(1).args, [resolvedTestPath, "BrowserA"]); // outputDir + browser
	t.deepEqual(pathJoinStub.getCall(2).args, [resolvedTestPath + "/BrowserA", "filename1"]);
	t.deepEqual(pathJoinStub.getCall(4).args, [resolvedTestPath, "some.path.BrowserB"]); // outputDir + browser
	t.deepEqual(pathJoinStub.getCall(5).args, [resolvedTestPath + "/some.path.BrowserB", "filename2"]);

	t.is(fsWriteFileStub.callCount, 2);
	t.deepEqual(fsWriteFileStub.getCall(0).args, [resolvedTestPath + "/BrowserA/filename1", "content1"]);
	t.deepEqual(fsWriteFileStub.getCall(1).args, [resolvedTestPath + "/some.path.BrowserB/filename2", "content2"]);
});

test("onBrowserComplete - save incoming export files (ensure unique file names)", async (t) => {
	const {FileExportReporter, base, logger, fsAccessStub, fsWriteFileStub} = t.context;

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

	fsAccessStub
	// file 1
		.onCall(0).rejects({code: "ENOENT"})
	// file 2
		.onCall(1).resolves()
		.onCall(2).rejects({code: "ENOENT"})
	// file 3
		.onCall(3).resolves()
		.onCall(4).resolves()
		.onCall(5).rejects({code: "ENOENT"});
	fsWriteFileStub
		.onCall(0).resolves()
		.onCall(1).resolves()
		.onCall(2).resolves();

	const fileExportReporter = new FileExportReporter(base, config, logger);
	await fileExportReporter.onBrowserComplete(browser, result);

	t.is(fsWriteFileStub.callCount, 3);
	t.true(fsWriteFileStub.getCall(0).args[0].endsWith("filename"));
	t.is(fsWriteFileStub.getCall(0).args[1], "content1");
	t.true(fsWriteFileStub.getCall(1).args[0].endsWith("filename_1"));
	t.is(fsWriteFileStub.getCall(1).args[1], "content2");
	t.true(fsWriteFileStub.getCall(2).args[0].endsWith("filename_2"));
	t.is(fsWriteFileStub.getCall(2).args[1], "content3");
});

test("onBrowserComplete - invalid export file path", async (t) => {
	const {FileExportReporter, base, logger, log, pathJoinStub, fsAccessStub, fsWriteFileStub} = t.context;

	const result = {
		exportFiles: [{
			name: "../foo/filename",
			content: "content1"
		}]
	};

	pathJoinStub
		.onCall(0).returns(resolvedTestPath)
		.onCall(1).returns("/resolved/foo/filename")
		.onCall(2).returns("/resolved/foo/filename");
	fsAccessStub
		.onCall(0).rejects({code: "ENOENT"});
	fsWriteFileStub
		.onCall(0).resolves();

	const fileExportReporter = new FileExportReporter(base, config, logger);
	await fileExportReporter.onBrowserComplete({}, result);

	t.is(fsWriteFileStub.callCount, 0);

	t.is(log.warn.callCount, 1);
	t.deepEqual(log.warn.getCall(0).args, ["Invalid export file path: /resolved/foo/filename\n\t" +
			"Make sure the file path is in directory: " + resolvedTestPath]);
});

test("onExit - done-function is only called if onBrowserComplete is processed (exitCode=0)", async (t) => {
	const {FileExportReporter, base, logger, sinon, fsAccessStub} = t.context;

	const result = {
		exportFiles: [{
			name: "filename",
			content: "content1"
		}]
	};
	const doneFunction = sinon.stub();

	const fileExportReporter = new FileExportReporter(base, config, logger);

	fileExportReporter.onExit(doneFunction);
	t.is(doneFunction.callCount, 0); // done-function not yet called

	fsAccessStub.onFirstCall().rejects({code: "ENOENT"});
	await fileExportReporter.onBrowserComplete({}, result);

	t.is(doneFunction.callCount, 1);
	t.deepEqual(doneFunction.getCall(0).args, [0]);
});

test("onExit - done-function is only called if onBrowserComplete is processed (exitCode=1)", async (t) => {
	const {FileExportReporter, base, logger, log, sinon, fsAccessStub} = t.context;

	const result = {
		exportFiles: [{
			name: "filename",
			content: "content1"
		}]
	};
	const doneFunction = sinon.stub();

	const fileExportReporter = new FileExportReporter(base, config, logger);

	fileExportReporter.onExit(doneFunction);
	t.is(doneFunction.callCount, 0); // done-function not yet called

	fsAccessStub.onFirstCall().callsFake(() => {
		throw new Error("errorMsg");
	});
	await fileExportReporter.onBrowserComplete({}, result);

	t.is(log.error.callCount, 1);
	t.deepEqual(log.error.getCall(0).args, ["An unexpected error occured while exporting files\n\terrorMsg"]);

	t.is(doneFunction.callCount, 1);
	t.deepEqual(doneFunction.getCall(0).args, [1]);
});

