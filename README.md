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

//Store changes to disk for 'scripts/settings',
//which is associated with './app/scripts/settings.ini' behind the scenes
config.store('scripts/settings');

```

#API Documentation

- [Glossary](#glossary)
    - [Stores](#store)

- [Configurator Constructor](#constructor)
    - [`new Configurator([Object options])`](#new-configuratorobject-options)

- [Static methods](#static-methods)
    - [`Configurator.getMainConfig([Object options])`](#configuratorgetmainconfigobject-options---configurator)

- [Static members](#static-members)
    - [`Configurator.version`](#configuratorversion)

- [Member methods](#member-methods)
    - [`.get(Array<String>|String)`](#getarraystringstring---dynamic)
    - [`.set(Array<String>|String key, Dynamic value)`](#setarraystringstring-key-dynamic-value---dynamic)
    - [`.load([Array<String>|String key, ] Object|String options|filepath [, callback])`](#loadarraystringstring-key--objectstring-optionsfilepath--callback---see-details)
    - [`.store(Array<String>|String key [, Object|String options|filepath [, callback]])`](#storearraystringstring-key--objectstring-optionsfilepath--callback)
        - alias: `.save`
    - [`.addStore(String name, Object store)`](#addstorestring-name-object-store)
    - [`.clear(Array<String>|String key)`](#cleararraystringstring-key)
    - [`.move(Array<String>|String fromKey, Array<String>|String toKey [, Boolean merge])`](#movearraystringstring-fromkey-arraystringstring-tokey--boolean-merge)
    - [`.merge(Array<String>|String key, Dynamic value [, String replaceKey])`](#mergearraystringstring-key-dynamic-value--string-replacekey---object)
    - [`.reset()`](#reset)

- [Private members](#private-members)
    - [`.root`](#root)
    - [`.meta`](#meta)
    - [`.options`](#options)

###Glossary

There is really only one term that may be strange.

#####Store

Stores are the routines that control the parsing and stringification/encoding of configuration data.

A typical store for JSON would look like:

```javascript
{
    parse: JSON.parse,
    stringify: JSON.stringify,
    extension: '.json'
}
```

So for that it is pretty 1:1 on the terminology.

The functions that parse are only given a simple string and are expected to return the Object that contained the parsed data.

The functions that stringify are only given the Objects that they are expected to stringify and should return just a string.

Any options given to other parse/stringify functions should be given by wrapping them in a function that does behave as specified above.

For example, if you wanted to have JSON stringify and pretty print it, you would do this:

```javascript
{
    parse: JSON.parse,
    stringify: function(obj) {
        return JSON.stringify(obj, null, true);
    },
    extension: '.json'
}
```

And then give that to `.addStore` with the name `'JSON-pretty'` or something similar. Then if you want to store a configuration as pretty printed JSON you would call `.store` like this:

```javascript
config.store('something/exports', {
    path: 'exports.json',
    dir: './',
    type: 'JSON-pretty'
});
```

###Constructor

<hr>
#####`new Configurator([Object options])`

Returns a new Configurator instance.

The options are, as of now:

```javascript
{
    separator: '/',
    storeMetadata: true
}
```

The `separator` field is how the keys are split apart. For example, the path `'users/john/pictures/'` or something like that would split into `'users' -> 'john' -> 'pictures'` and be placed there accordingly.

The `storeMetadata` Boolean value refers to the loading and storing of configuration files, such as YAML, JSON and INI files. If true, the Configurator instance will remember the location of these files and associate them with the key path they are loaded into. This makes for easy storing of configuration files.

###Static methods

<hr>
#####`Configurator.getMainConfig([Object options])` -> `Configurator`

If a main instance does not exist, it will create with with any options provided (See Configurator constructor for options details).

Otherwise, it will return the previously created Configurator instance.

###Static members

<hr>
#####`Configurator.version`

Contains version information for the module in the format `'major.minor.revision'`

###Member methods

<hr>
#####`.get(Array<String>|String)` -> `Dynamic`

Returns the value stored at that key path if there is one, or undefined if there is no associated value.

<hr>
#####`.set(Array<String>|String key, Dynamic value)` -> `Dynamic`

Sets the value of a key with value and then returns the stored value.

`.set` will also automatically create any paths between the root path and the provided key.

<hr>
#####`.load([Array<String>|String key, ] Object|String options|filepath [, callback])` -> `See details`

The load function has some of the more complicated logic.

The `key` value is optional, but denotes where to store the loaded configuration file. If the key is not present, then it will store the configuration at the root path under the file name.

The filepath or loading options are required, though. If you provide a regular filepath, then the Configurator will load it and parse it with whatever store matched up with the file extension. For example, `test.json` will use the JSON store.

If an object is passed into `.load` then it should look something like this:

```javascript
{
    path: String,
    dir: String,
    type: String
}
```

For the same JSON file used above, the load options would be:

```javascript
{
    path: 'test.json',
    dir: './',
    type: 'JSON'
}
```

Additionally, if a callback is passed last, then it will load the file asynchronously and call the callback when it is done, passing it the parsed configuration.

If no callback is given, it will load and parse the file synchronously.

This is redundant for the simple reason of extensibility. When it comes to adding custom stores, such as loading or saving unsafe YAML files for example, then passing an option object like this makes sense.

See here:

```javascript
{
    path: 'script_functions.yaml',
    dir: './scripts/',
    type: 'YAML-UNSAFE'
}
```

Where 'YAML-UNSAFE' is a custom store used to parse/stringify unsafe YAML code. By default, YAML is included with Configurator but uses the safe settings.

NOTE: dir is technically not needed for the load options, but is included in all examples anyway.

<hr>
#####`.store(Array<String>|String key [, Object|String options|filepath [, callback]])`
######alias: '.save'

`.store` is the inverse of `.load`. While the `key` was optional with `.load`, it is required here.

However, if the configuration key path you are trying to save is associated with an already loaded file, then the filepath or save options are not needed, but you can provide them anyway if you want to save the file elsewhere or with another Store.

For example, the example given in the glossary with the custom JSON Store that pretty-prints the output:

```javascript
config.store('something/exports', {
    path: 'exports.json',
    dir: './',
    type: 'JSON-pretty'
});
```

Assuming you added the `'JSON-pretty'` Store to the Configurator.

Additionally, like `.load`, `.store` can be executed asynchronously or synchronously, depending on whether or not a callback is given to it.

NOTE: if `storeMetadata` is set to false, Configurator cannot automatically know the location in which to save the file, so a filepath or save

<hr>
#####`.addStore(String name, Object store)`

The glossary shows how a store object should be, and this function allows the addition of custom stores.

For example, adding the pretty print JSON store would be as easy as:

```javascript
config.addStore('JSON-pretty', {
    parse: JSON.parse,
    stringify: function(obj) {
        return JSON.stringify(obj, null, true);
    },
    extension: '.json'
});
```

And it will be added with the name/type `'JSON-pretty'`.

NOTE: Store names as CASE INSENSITIVE.

<hr>
#####`.clear(Array<String>|String key)`

Deletes the entire value at the key path. Returns nothing.

<hr>
#####`.move(Array<String>|String fromKey, Array<String>|String toKey [, Boolean merge])`

Moves the value at `fromKey` to the location of `toKey`.

If `merge` is set to true, if `toKey` already has a value then it and the value at `fromKey` will be merged together then stored at `toKey`.

<hr>
#####`.merge(Array<String>|String key, Dynamic value [, String replaceKey])` -> `Object`

This will take `value` and merge it with whatever is at `key`.

If the value already at `key` is no an object, then it will create an object and put the previous value in it under the name given by `replaceKey`.

`replaceKey` defaults to `'_'`.

<hr>
#####`.reset()`

This will completely reset the entire Configurator instance, clearing all data. Use with care.

###Private Members

These are internal variables that should not be tampered with, but I'm including documentation of anyway.

#####`.root`

`.root` is the root node of the configuration tree. Everything is saved inside it.

#####`.meta`

`.meta` acts as a hashtable to store raw information about file loads. It allows for `.store` to save configuration paths that were created from loaded files automatically.

#####`.options`

`.options` is a small object containing only two (as of now) options that are the same as given in the constructor.

*NOTE*: changing the internal options object can mess up the `.meta` object. So it should never be changed after construction.
