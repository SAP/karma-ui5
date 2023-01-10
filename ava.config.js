export default {
	files: ["test/unit/**/*.js"],
	nodeArguments: [
		"--loader=esmock",
		"--no-warnings"
	]
};
