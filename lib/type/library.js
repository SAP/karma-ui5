const {ErrorMessage} = require("../errors");
const {
	createProjectFilesPattern,
	pathsExist
} = require("../utils");

module.exports.init = async function(config, logger) {
	const srcFolder = config.ui5.paths.src;
	const testFolder = config.ui5.paths.test;

	const [hasSrc, hasTest] = pathsExist(config.basePath, [srcFolder, testFolder]);
	if (!hasSrc || !hasTest) {
		logger.log("error", ErrorMessage.libraryFolderNotFound({
			srcFolder, testFolder, hasSrc, hasTest
		}));
		throw new Error(ErrorMessage.failure());
	}

	config.files.push(
		// Match all files (including dotfiles)
		createProjectFilesPattern(`${config.basePath}/{${srcFolder}/**,${srcFolder}/**/.*}`),
		createProjectFilesPattern(`${config.basePath}/{${testFolder}/**,${testFolder}/**/.*}`),
	);
};
