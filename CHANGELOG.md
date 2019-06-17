# Changelog
All notable changes to this project will be documented in this file.  
This project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

A list of unreleased changes can be found [here](https://github.com/SAP/karma-ui5/compare/v1.0.1...HEAD).

<a name="v1.0.1"></a>
## [v1.0.1] - 2019-06-17

<a name="v1.0.0"></a>
## [v1.0.0] - 2019-04-04
### Breaking Changes
- Update karma peerDependency to ">= 1.7.1" [`2d06e91`](https://github.com/SAP/karma-ui5/commit/2d06e91a6eeb1d5439d64019fe36f2106d9e67ae)

### Bug Fixes
- Don't create webpack bundle on postinstall [`8dbb33a`](https://github.com/SAP/karma-ui5/commit/8dbb33aba77902d3d700f8ff0e680f02a3659088)
- Keep last test page open [`6abbec4`](https://github.com/SAP/karma-ui5/commit/6abbec4da2d6becc655b3d885800ab6caf8a64ca)
- Use full screen size for QUnit HTML iframe [`e8c63a5`](https://github.com/SAP/karma-ui5/commit/e8c63a5db7764c180bdac033bfd9bd88f7809109)
- **TypeError:** top.jsUnitTestSuite is not a constructor [`729a9d3`](https://github.com/SAP/karma-ui5/commit/729a9d38b6f08d02b1cb81d2877a19f0631863cb)

### Features
- Enable UI5 Tooling support for "script" mode [`5e80a72`](https://github.com/SAP/karma-ui5/commit/5e80a7200a9858240ccdcde8c0d091460087bfbd)
- Introduce "html" / "script" mode [`bc0aa54`](https://github.com/SAP/karma-ui5/commit/bc0aa548f17a19e483176367d01a6aef6fa6e96c)


<a name="v1.0.0-beta.2"></a>
## [v1.0.0-beta.2] - 2019-03-22
### Bug Fixes
- Run tests in iFrame by default ([#32](https://github.com/SAP/karma-ui5/issues/32)) [`7c4a825`](https://github.com/SAP/karma-ui5/commit/7c4a82554c51a14dd3c287887641c3520c4a6835)
- Missing testrunner.html when using npm dependencies ([#27](https://github.com/SAP/karma-ui5/issues/27)) [`c2adeed`](https://github.com/SAP/karma-ui5/commit/c2adeedb26dc18771b70500de724a90606b9fc1c)
- Add missing dependency to "js-yaml" [`619431f`](https://github.com/SAP/karma-ui5/commit/619431f6c526bba0137c03aa771c506b5c491ebe)


<a name="v1.0.0-beta.1"></a>
## [v1.0.0-beta.1] - 2019-03-13
### Breaking Changes
- Require Node.js >= 8.5 [`ad7b772`](https://github.com/SAP/karma-ui5/commit/ad7b772d80040f7d1fd069675e4447104cc81b2d)
- Rename framework / config to ui5 [`4ce4609`](https://github.com/SAP/karma-ui5/commit/4ce460977c8bc0171efd3943322dcc1642d562a4)
- Rename package to karma-ui5 [`74ad2e8`](https://github.com/SAP/karma-ui5/commit/74ad2e8cb04dd637f6eb4583b2689f7f837db064)

### Features
- Integrate execution without htmlrunner [`e991ac6`](https://github.com/SAP/karma-ui5/commit/e991ac6a23f3249e89169d09a556b085d6ff125d)
- Add QUnit HTML runner [`2b69ab0`](https://github.com/SAP/karma-ui5/commit/2b69ab03a70db477d5da47b68d4aa904f0908fec)

### BREAKING CHANGE

Support for older Node.js releases has been dropped.
Only Node.js v8.5 or higher is supported.

The framework and config names have been changed from `openui5` to
`ui5`.

The `useMockServer` option has been removed.
A MockServer needs to be started from the test code.

The package has been renamed from `karma-openui5` to `karma-ui5`. New
versions will only be published as `karma-ui5`.


<a name="0.2.3"></a>
## [0.2.3] - 2017-12-28

<a name="0.2.2"></a>
## [0.2.2] - 2017-03-29

<a name="0.2.1"></a>
## [0.2.1] - 2014-12-11

<a name="0.2.0"></a>
## [0.2.0] - 2014-12-09

<a name="0.1.2"></a>
## [0.1.2] - 2014-12-08

<a name="0.1.0"></a>
## 0.1.0 - 2014-12-08

[v1.0.1]: https://github.com/SAP/karma-ui5/compare/v1.0.0...v1.0.1
[v1.0.0]: https://github.com/SAP/karma-ui5/compare/v1.0.0-beta.2...v1.0.0
[v1.0.0-beta.2]: https://github.com/SAP/karma-ui5/compare/v1.0.0-beta.1...v1.0.0-beta.2
[v1.0.0-beta.1]: https://github.com/SAP/karma-ui5/compare/0.2.3...v1.0.0-beta.1
[0.2.3]: https://github.com/SAP/karma-ui5/compare/0.2.2...0.2.3
[0.2.2]: https://github.com/SAP/karma-ui5/compare/0.2.1...0.2.2
[0.2.1]: https://github.com/SAP/karma-ui5/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/SAP/karma-ui5/compare/0.1.2...0.2.0
[0.1.2]: https://github.com/SAP/karma-ui5/compare/0.1.0...0.1.2
