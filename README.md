![UI5](http://openui5.org/images/OpenUI5_new_big_side.png)

[![NPM Version](http://img.shields.io/npm/v/karma-ui5.svg?style=flat)](https://www.npmjs.org/package/karma-ui5)

**Table of Contents**

- [About](#about)
  - [Installation](#installation)
  - [Configuration](#configuration)
    - [Module Types](#module-types)
    - [Custom paths](#custom-paths)
    - [Proxy](#proxy)
    - [UI5 Middleware](#ui5-middleware)
  - [Advanced usage](#advanced-usage)
    - [Configuration](#configuration-1)
      - [Bootstrap](#bootstrap)
      - [Tests](#tests)
  - [Application constrains](#application-constrains)
    - [QUnit dependency](#qunit-dependency)
    - [OPA5: Component containers instead of iFrames](#opa5-component-containers-instead-of-iframes)
  - [License](#license)

# About
Adapter for UI5 framework. This adapter loads UI5 from the specified location and makes it available for the tests to run in karma afterwards.

## Installation
The easiest way is to add `karma-ui5` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "karma-ui5": "^1.0.0"
  }
}
```

Information on how to install `karma` can be found [here.](https://karma-runner.github.io/3.0/intro/installation.html)

## Configuration

### Module Types
UI5 supports 2 different module types: application and library. The type can be defined using the type property

```javascript
// karma.conf.js
{
  "ui5": {
    "type": "application"
  }
}
```

The plugin discovers the type automatically in case if no type was entered in the config. Here it is important to follow the UI5 folder naming convention.

* webapp for appplications
* src and test for libraries

### Custom paths

By default the folder names must follow the UI5 naming convention, therefore using different folder names and location will lead to malfunction. In this case it is possible to overwrite the default folder paths using the paths property.

**Application**
```javascript
"ui5": {
  "type": "application",
  "paths": {
    "webapp": "custompath/to/application"
  }
}
```

**Library**
```javascript
"ui5": {
  "type": "library",
  "paths": {
    "src": "custompath/to/src",
    "test": "custompath/to/test"
  }
}
```

> Note: the module type needs to be defined manually in this case.

### Proxy
Using a proxy it is possible to serve UI5 resources from a specific destination. A proxy could for example be used for  test execution with different UI5 versions.

```json
"ui5": {
  "url": "https://openui5nightly.hana.ondemand.com"
}
```

It is also possible to set the url directly from the CLI.

```shell
karma start --ui5-url="https://openui5nightly.hana.ondemand.com"
```

### UI5 Middleware
UI5 Middleware can additionally be used to serve files.

```javascript
// karma.conf.js
{
  "ui5": {
    "useMiddleware": true
  }
}
```

In this case a few requirements need to be fulfilled. First of all the application/library must contain a valid ui5.yaml e.g.

```yaml
---
specVersion: "1.0"
type: application
metadata:
  name: test.app
```

Next all used modules must be defined in the package.json.

```javascript
// package.json
{
  "dependencies": {
    "@openui5/sap.ui.core": "*"
  }
}
```

## Advanced usage

The plugin by default searches for html files (testsuite.html) for execution. In case if the testrunner shouldn't be used it is required to set the **htmlrunner** property.

```javascript
{
  "ui5": {
    "htmlrunner": false
  }
}
```

### Configuration

For the client UI5 configuration you can create an object using any of the options described in the
[documentation](https://openui5.hana.ondemand.com/#/topic/91f2d03b6f4d1014b6dd926db0e91070.html).

#### Bootstrap
In case if htmlrunner is not used, it is also important to set the bootstrap via configuration instead of directly inside the index.html. For example:

```javascript
"ui5": {
  "config": {
    "theme": 'sap_belize',
    "language": 'EN',
    "bindingSyntax": 'complex',
    "compatVersion": 'edge',
    "async": true,
    "resourceroots": {'test.app': './base/webapp'}
  }
}
```

#### Tests
To automatically load test modules (via `sap.ui.require`), the `tests` config can be set to an array of module names e.g.

```javascript
// karma.conf.js
"tests": [ 'test/app/test/test.qunit' ]
```

> Note: Please note that it the resourceroots need to be defined for proper file system mappings.

## Application constrains
### QUnit dependency
Do no require QUnit resources from within the tests. Karma loads its own versions of them in order hook in its reporting at the right places.

Therefore rather load those resources in the non-karma specific test runner HTML pages. Like this:
````html
    <script src="../../resources/sap/ui/thirdparty/qunit.js"></script>
    <script src="../../resources/sap/ui/qunit/qunit-css.js"></script>
````

### OPA5: Component containers instead of iFrames
*Only relevant when using [Istanbul](https://istanbul.js.org/) to create test coverage*

[Istanbul](https://istanbul.js.org/) has problems collecting code coverage results from within iFrames. To gather code coverage from OPA5 tests you need to execute them inside of component containers instead of iFrames. This will also speed up the execution time of your OPA5 tests.

**Notice:** With component containers you will loose the isolation of your single tests. Also, your applications `index.html` won't be executed anymore (as only the applications `Component.js` will be needed).

In your tests, replace `iStartMyAppInAFrame()` with`iStartMyUIComponent()` and `iTeardownMyAppFrame()` with `iTeardownMyUIComponent()`.

For more information see the API reference of [sap.ui.test.Opa5](https://sapui5.hana.ondemand.com/#docs/api/symbols/sap.ui.test.Opa5.html#iStartMyUIComponent)

## License
(c) Copyright 2019 SAP SE or an SAP affiliate company

Licensed under the Apache License, Version 2.0 - see LICENSE.
