module.exports = function (grunt) {
	grunt.initConfig({
		pkgFile: 'package.json',
		files: {
			adapter: ['src/adapter.js']
		},
		build: {
			adapter: '<%= files.adapter %>'
		}
	});

	grunt.loadTasks('tasks');

	grunt.registerTask('default', ['build']);
};
