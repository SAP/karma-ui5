import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";
import js from "@eslint/js";
import google from "eslint-config-google";

export default [
	js.configs.recommended,
	google,
	{
		ignores: ["**/dist/", "**/coverage/", "**/docs/"],
	},
	{
		plugins: {
			jsdoc,
		},

		languageOptions: {
			globals: {
				...globals.node,
			},

			ecmaVersion: 2023,
			sourceType: "module",
		},

		settings: {
			jsdoc: {
				tagNamePreference: {
					return: "returns",
				},
			},
		},

		rules: {
			"indent": ["error", "tab"],
			"linebreak-style": ["error", "unix"],

			"quotes": [
				"error",
				"double",
				{
					allowTemplateLiterals: true,
				},
			],

			"semi": ["error", "always"],
			"no-negated-condition": "off",
			"require-jsdoc": "off",
			"no-mixed-requires": "off",

			"max-len": [
				"error",
				{
					code: 120,
					ignoreUrls: true,
					ignoreRegExpLiterals: true,
				},
			],

			"no-implicit-coercion": [
				2,
				{
					allow: ["!!"],
				},
			],

			"comma-dangle": "off",
			"no-tabs": "off",
			// This rule must be disabled as of ESLint 9. It's removed and causes issues when present.
			// https://eslint.org/docs/latest/rules/valid-jsdoc
			"valid-jsdoc": 0,
			// Starting with ESLint v8, it needs to be disabled as it currently can't be supported
			// See: https://github.com/eslint/eslint/issues/14745
			"jsdoc/check-examples": 0,
			"jsdoc/check-param-names": 2,
			"jsdoc/check-tag-names": 2,
			"jsdoc/check-types": 2,
			"jsdoc/no-undefined-types": 0,
			"jsdoc/require-description": 0,
			"jsdoc/require-description-complete-sentence": 0,
			"jsdoc/require-example": 0,
			"jsdoc/require-hyphen-before-param-description": 0,
			"jsdoc/require-param": 2,
			"jsdoc/require-param-description": 0,
			"jsdoc/require-param-name": 2,
			"jsdoc/require-param-type": 2,
			"jsdoc/require-returns": 0,
			"jsdoc/require-returns-description": 0,
			"jsdoc/require-returns-type": 2,

			"jsdoc/tag-lines": [
				2,
				"any",
				{
					startLines: 1,
				},
			],

			"jsdoc/valid-types": 0,
		},
	},
	{
		files: ["**/*.cjs"],

		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "script",
		},
	},
	{
		files: [
			"lib/client/**",
			"test/integration/*/webapp/**/*.js",
			"test/integration/*/src/**/*.js",
			"test/integration/*/test/**/*.js",
		],

		languageOptions: {
			globals: {
				...globals.browser,
				sap: "readonly",
			},
		},
	},
];
