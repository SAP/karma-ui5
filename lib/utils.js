const path = require("path");
const fs = require("fs");

function replaceLast(path, replacement) {
	return path.split("/").slice(0, -1).concat(replacement).join("/");
}

function createPluginFilesPattern(pattern) {
	return {pattern, included: true, served: true, watched: false};
}

function createProjectFilesPattern(pattern) {
	return {pattern, included: false, served: true, watched: true};
}


/**
 * Checks if a list of paths exists
 *
 * @private
 * @param {string} basePath
 * @param {Array} paths List of paths to check
 *
 * @returns {boolean[]} array if path exist
 */
function pathsExist(basePath, paths) {
	return paths.map((folderName) => exists(path.join(basePath, folderName)));
}

/**
 * Checks if a file or path exists
 *
 * @private
 * @param {string} filePath Path to check
 * @returns {boolean} true if the file or path exists
 */
function exists(filePath) {
	try {
		return fs.statSync(filePath).isDirectory();
	} catch (err) {
		// "File or directory does not exist"
		if (err.code === "ENOENT") {
			return false;
		} else {
			throw err;
		}
	}
}

module.exports = {
	replaceLast,
	createPluginFilesPattern,
	createProjectFilesPattern,
	pathsExist,
	exists
};
