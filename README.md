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
    "karma-openui5": "~0.2"
  }
}
```

How install `karma` you can read [here.](http://karma-runner.github.io/0.12/intro/installation.html)

Configuration
-------------

Following code shows the available configuration options.

For the client OpenUI5 configuration you can create an object using any of the options described in the
[documentation](https://openui5.hana.ondemand.com/docs/guide/91f2d03b6f4d1014b6dd926db0e91070.html).

For the mockserver config you can pass an object like you would do it for the ``sap.ui.core.util.MockServer.config``
function. The rootUri and the metadataURL are required properties if you use the mock server. You can also pass
mockdata settings like you would do it for the ``simulate`` function of the MockServer. The MockServer needs to be
enabled explicitly by settings the ``useMockServer`` option. 

```js
// karma.conf.js
module.exports = function(config) {
  config.set({
    frameworks: ['openui5'],

    openui5: {
      path: 'http://path/to/sap-ui-core.js',
      useMockServer: false
    },

    client: {
      openui5: {
        config: {
          theme: 'sap_bluecrystal'
        },
        mockserver: {
          config: {
            autoRespond: true
          },
          rootUri: '/my/service/',
          metadataURL: '/base/test/mock.xml',
          mockdataSettings: {
          
          }
        }
      }
    }
  });
};
```


License
-------

(c) Copyright 2014 SAP SE or an SAP affiliate company

Licensed under the Apache License, Version 2.0 - see LICENSE.
