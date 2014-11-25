![OpenUI5](http://openui5.org/images/OpenUI5_new_big_side.png)

[![NPM Version](http://img.shields.io/npm/v/karma-openui5.svg?style=flat)](https://www.npmjs.org/package/karma-openui5)

karma-openui5
=====================

Adapter for OpenUI5/SAPUI5 UI framework. This Adapter load OpenUI5/SAPUI5 from the specified location and makes it
available for the tests the run in karma afterwards.

Installation
------------

The easiest way is to keep `karma-openui5` as a devDependency in your `package.json`.
```json
{
  "devDependencies": {
    "karma-openui5": "~0.1"
  }
}
```

How install `karma` you can read [here.](http://karma-runner.github.io/0.12/intro/installation.html)

Configuration
-------------

Following code shows the available configuration options

```js
// karma.conf.js
module.exports = function(config) {
  config.set({
    frameworks: ['openui5'],

    ui5: {
      path: 'http://path/to/sap-ui-core.js',
    },

    client: {
      ui5: {
        libs: [
          'sap.m'
        ]
        theme: 'sap_bluecrystal',
        debug: 'false',
        resourceRoots: {
            'sap.app.test': '/base/src/app'
        }
        bindingSyntax: 'complex'
      }
    }
  });
};
```


License
-------

(c) Copyright 2014 SAP SE or an SAP affiliate company
Licensed under the Apache License, Version 2.0 - see LICENSE.