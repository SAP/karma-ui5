const project = jest.genMockFromModule("@ui5/project");
project.normalizer = {
	generateProjectTree: () => {
		return Promise.resolve({
			metadata: {
				name: "test.app"
			}
		});
	}
};
module.exports = project;
