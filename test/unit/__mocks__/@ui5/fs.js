const fs = jest.genMockFromModule("@ui5/fs");
fs.resourceFactory = {
	createCollectionsForTree: () => {
		return {
			source: {},
			dependencies: {}
		};
	},
	createWorkspace: () => {
		return {};
	}
};
class ReaderCollectionPrioritized {}
fs.ReaderCollectionPrioritized = ReaderCollectionPrioritized;

fs.fsInterface = function() {
	return {}; // TODO
};

module.exports = fs;
