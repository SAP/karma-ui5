module.exports = function (grunt) {
	grunt.initConfig({
		pkgFile: 'package.json',
		files: {
			adapter: ['src/adapter.js'],
			mockserver: ['src/mockserver.js']
		},
		build: {
			adapter: '<%= files.adapter %>',
			mockserver: '<%= files.mockserver %>'
		},
		'npm-publish': {
			options: {
				requires: [ 'build' ]
			}
		}
	});

	grunt.loadTasks('tasks');
	grunt.loadNpmTasks('grunt-npm');

	grunt.registerTask('default', ['build']);
	grunt.registerTask('release', ['build', 'npm-publish']);
};
