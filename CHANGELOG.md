# Changelog
All notable changes to this project will be documented in this file.  
This project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

A list of unreleased changes can be found [here](https://github.com/SAP/karma-ui5/compare/v2.4.0...HEAD).

<a name="v2.4.0"></a>
## [v2.4.0] - 2021-12-08
### Features
- Add fileExport capability ([#352](https://github.com/SAP/karma-ui5/issues/352)) [`56aac75`](https://github.com/SAP/karma-ui5/commit/56aac75077793eb377ecd5d6f179654ef4b3ddfe)


<a name="v2.3.4"></a>
## [v2.3.4] - 2021-06-10
### Bug Fixes
- Adapt discovery to recent changes in OpenUI5 ([#319](https://github.com/SAP/karma-ui5/issues/319)) [`0059cfc`](https://github.com/SAP/karma-ui5/commit/0059cfcc458953ef9d349e83ac5d8a397755e428)


<a name="v2.3.3"></a>
## [v2.3.3] - 2021-02-01

<a name="v2.3.2"></a>
## [v2.3.2] - 2020-11-24
### Bug Fixes
- Creating multiple plugin instances ([#261](https://github.com/SAP/karma-ui5/issues/261)) [`d4e3faa`](https://github.com/SAP/karma-ui5/commit/d4e3faa520e76eea5b9e2997aefafc9e60dc38da)


<a name="v2.3.1"></a>
## [v2.3.1] - 2020-10-13
### Bug Fixes
- Add error logging for proxy requests ([#254](https://github.com/SAP/karma-ui5/issues/254)) [`e79e77d`](https://github.com/SAP/karma-ui5/commit/e79e77df4b23e306974deb0e6e888c0274099e76)
- Improve library request handling ([#251](https://github.com/SAP/karma-ui5/issues/251)) [`762cde2`](https://github.com/SAP/karma-ui5/commit/762cde2e389c5293295377c8c372e1711d17bb14)


<a name="v2.3.0"></a>
## [v2.3.0] - 2020-09-02
### Bug Fixes
- **README:** Add Script Mode configuration to Quickstart Guide ([#221](https://github.com/SAP/karma-ui5/issues/221)) [`3fe2d4e`](https://github.com/SAP/karma-ui5/commit/3fe2d4ef225dd947f9965e076997e4ca305f31a4)

### Features
- Add "failOnEmptyTestPage" option ([#228](https://github.com/SAP/karma-ui5/issues/228)) [`6b9648b`](https://github.com/SAP/karma-ui5/commit/6b9648b322ecea824c2981feb8becd840f601174)


<a name="v2.2.1"></a>
## [v2.2.1] - 2020-08-24
### Bug Fixes
- **HTML mode:** QUnit.config.noglobals with coverage enabled ([#223](https://github.com/SAP/karma-ui5/issues/223)) [`3764e9f`](https://github.com/SAP/karma-ui5/commit/3764e9f36751335c34c653c43332823ef5655463)


<a name="v2.2.0"></a>
## [v2.2.0] - 2020-06-16
### Features
- Add iframe coverage support ([#194](https://github.com/SAP/karma-ui5/issues/194)) [`3b5e67b`](https://github.com/SAP/karma-ui5/commit/3b5e67bb8a291da3c64e8c3c361765d6bbd010b1)


<a name="v2.1.2"></a>
## [v2.1.2] - 2020-05-25
### Bug Fixes
- Protocol error when using https ui5.url [`6396bb4`](https://github.com/SAP/karma-ui5/commit/6396bb4439683db16b98d25882f2154b8dfd886f)


<a name="v2.1.1"></a>
## [v2.1.1] - 2020-05-19
### Bug Fixes
- Improve performance when serving UI5 resources via URL [`20b6512`](https://github.com/SAP/karma-ui5/commit/20b651258722973ec8dc4a8391808dab8bc335f0)


<a name="v2.1.0"></a>
## [v2.1.0] - 2020-04-09
### Features
- Add "configPath" option [`6f90051`](https://github.com/SAP/karma-ui5/commit/6f90051cca0859c7ebc694eb2c29ab133e44051b)


<a name="v2.0.0"></a>
## [v2.0.0] - 2020-04-02
### Breaking Changes
- Require karma >= 4.3.0 [`ee0dbc0`](https://github.com/SAP/karma-ui5/commit/ee0dbc0ece4e66b4b5956e0c83817823c5381772)
- Require Node.js >= 10 [`ca4ed45`](https://github.com/SAP/karma-ui5/commit/ca4ed459d4f079c5055753f958af21c66dd12b07)

### Features
- Support UI5 Tooling specVersion 2.0 / Add all ui5 serve middlewares [`fbfcb09`](https://github.com/SAP/karma-ui5/commit/fbfcb09e2a5eadf9203edc334bec26d1be1f8837)

### BREAKING CHANGE

The ui5 framework is now initialized asynchronous, which is only
supported starting with karma v4.3.0.

Support for older Node.js releases has been dropped.
Only Node.js v10 or higher is supported.


<a name="v1.2.0"></a>
## [v1.2.0] - 2020-04-01
### Bug Fixes
- **Error Handling:** Prevent UnhandledRejection [`4e1db52`](https://github.com/SAP/karma-ui5/commit/4e1db528fe15346d1009e97a3a36323f3ba29715)

### Features
- Allow usage with non-blacklisted karma plugins ([#163](https://github.com/SAP/karma-ui5/issues/163)) [`1d41181`](https://github.com/SAP/karma-ui5/commit/1d411816fe8d524a0df4e214f33e15fc1556facb)


<a name="v1.1.0"></a>
## [v1.1.0] - 2019-09-06
### Bug Fixes
- Resolve absolute paths (webapp / src / test) [`4f8c180`](https://github.com/SAP/karma-ui5/commit/4f8c180c0f38e3f6950b9f1bfb40d4d0dbb03c6e)
- Fix link in testsuite error messages [`8129dfd`](https://github.com/SAP/karma-ui5/commit/8129dfd5a9a9e10353145e06ec2aae5da93513f4)
- Improve error handling ([#102](https://github.com/SAP/karma-ui5/issues/102)) [`482d646`](https://github.com/SAP/karma-ui5/commit/482d64625dce50b06d1d09d4a76dd05e80831c9a)
- Execution in IE11 (html mode) [`7c793ae`](https://github.com/SAP/karma-ui5/commit/7c793ae1640d03594e95bf0172f7cb01f35f9c95)

### Features
- Add option to provide URL parameters for each testpage ([#109](https://github.com/SAP/karma-ui5/issues/109)) [`7722d4a`](https://github.com/SAP/karma-ui5/commit/7722d4a2e3ace7db27991599d03a3d6ff95d133e)


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

[v2.4.0]: https://github.com/SAP/karma-ui5/compare/v2.3.4...v2.4.0
[v2.3.4]: https://github.com/SAP/karma-ui5/compare/v2.3.3...v2.3.4
[v2.3.3]: https://github.com/SAP/karma-ui5/compare/v2.3.2...v2.3.3
[v2.3.2]: https://github.com/SAP/karma-ui5/compare/v2.3.1...v2.3.2
[v2.3.1]: https://github.com/SAP/karma-ui5/compare/v2.3.0...v2.3.1
[v2.3.0]: https://github.com/SAP/karma-ui5/compare/v2.2.1...v2.3.0
[v2.2.1]: https://github.com/SAP/karma-ui5/compare/v2.2.0...v2.2.1
[v2.2.0]: https://github.com/SAP/karma-ui5/compare/v2.1.2...v2.2.0
[v2.1.2]: https://github.com/SAP/karma-ui5/compare/v2.1.1...v2.1.2
[v2.1.1]: https://github.com/SAP/karma-ui5/compare/v2.1.0...v2.1.1
[v2.1.0]: https://github.com/SAP/karma-ui5/compare/v2.0.0...v2.1.0
[v2.0.0]: https://github.com/SAP/karma-ui5/compare/v1.2.0...v2.0.0
[v1.2.0]: https://github.com/SAP/karma-ui5/compare/v1.1.0...v1.2.0
[v1.1.0]: https://github.com/SAP/karma-ui5/compare/v1.0.1...v1.1.0
[v1.0.1]: https://github.com/SAP/karma-ui5/compare/v1.0.0...v1.0.1
[v1.0.0]: https://github.com/SAP/karma-ui5/compare/v1.0.0-beta.2...v1.0.0
[v1.0.0-beta.2]: https://github.com/SAP/karma-ui5/compare/v1.0.0-beta.1...v1.0.0-beta.2
[v1.0.0-beta.1]: https://github.com/SAP/karma-ui5/compare/0.2.3...v1.0.0-beta.1
[0.2.3]: https://github.com/SAP/karma-ui5/compare/0.2.2...0.2.3
[0.2.2]: https://github.com/SAP/karma-ui5/compare/0.2.1...0.2.2
[0.2.1]: https://github.com/SAP/karma-ui5/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/SAP/karma-ui5/compare/0.1.2...0.2.0
[0.1.2]: https://github.com/SAP/karma-ui5/compare/0.1.0...0.1.2
