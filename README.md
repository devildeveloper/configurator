Configurator
============

Configurator is a library for organizing, loading, storing and overall dealing with configuration data and files of any kind. 

It comes with support for JSON, YAML and INI files, and more can easily be added. 

Example usage:
```javascript

var config = require('configurator').getMainConfig();

//Load in an arbitrary INI file at 'scripts/settings'
config.load('scripts/settings', './app/scripts/settings.ini');

//Prints value loaded from settings.ini
console.log(config.get('scripts/settings/maxAppInstances'));

//Set a new value for maxAppInstances
config.set('scripts/settings/maxAppInstances', 10);

//Store changes to disk for 'scripts/settings', which is associated with './app/scripts/settings.ini'
config.store('scripts/settings');

```

#API Documentation

//TODO
