const yaml = jest.genMockFromModule("js-yaml");

const yamlException = new Error("Could not parse YAML");
yamlException.name = "YAMLException";

yaml.loadAll = jest.fn(function(fileContent) {
	switch (fileContent) {
	case "--1-\nfoo: 1":
		throw yamlException;
	case "---\n":
		return [{}];
	case "---\ntype: application\n":
		return [{type: "application"}];
	case "---\ntype: library\n":
		return [{type: "library"}];
	default:
		break;
	}
});
module.exports = yaml;
