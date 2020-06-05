const {ErrorMessage} = require("../errors");
const {
	createProjectFilesPattern,
	createPropertiesFilesPattern,
	pathsExist
} = require("../utils");

module.exports.init = async function(config, log) {
	const srcFolder = config.ui5.paths.src;
	const testFolder = config.ui5.paths.test;

	const [hasSrc, hasTest] = pathsExist(config.basePath, [srcFolder, testFolder]);
	if (!hasSrc || !hasTest) {
		log.error(ErrorMessage.libraryFolderNotFound({
			srcFolder, testFolder, hasSrc, hasTest
		}));
		throw new Error(ErrorMessage.failure());
	}

	config.files.push(
		// Match all files (including dotfiles)
		createPropertiesFilesPattern(`${config.basePath}/${srcFolder}/**/*.properties`),
		createPropertiesFilesPattern(`${config.basePath}/${testFolder}/**/*.properties`),

		createProjectFilesPattern(`${config.basePath}/${srcFolder}/**/!(*.properties)`),
		createProjectFilesPattern(`${config.basePath}/${srcFolder}/**/.*`),
		createProjectFilesPattern(`${config.basePath}/${testFolder}/**/!(*.properties)`),
		createProjectFilesPattern(`${config.basePath}/${testFolder}/**/.*`),
	);
};
