/**
 * Created by novacrazy on 6/12/14.
 */

var _ = require( 'lodash' );
var path = require( 'path' );
var fs = require( 'fs' );

/*
 * Stores are simple objects that contain a 'parse' method, 'stringify' method and the file extension of the associated store
 *
 * */
var stores = require( './stores' );


/**
 * Main Configurator constructor
 *
 * @constructor
 * @param {Object} options
 * @returns {Object} this
 * */
function Configurator(options) {
    'use strict';

    if( !(this instanceof Configurator) ) {
        return new Configurator( options );

    } else {
        //set the default options
        this.options = _.defaults( options || {}, {
            separator:     '/',
            storeMetadata: true
        } );

        //initialize the internal variables
        this.root = {}; //Where configurations are stored

        if( this.options.storeMetadata ) {
            this.meta = {}; //Where file info for loaded configs are stored
        }

        //clone the stores so new ones can be added without affecting the original require
        this.stores = _.clone( stores );
    }
}

/**
 * Returns an object with information about the path or path object
 * given as an argument to another function
 *
 * The path object should look like:
 * {
 *   path: String,
 *   dir: String,
 *   type: String
 * }
 *
 * @param {Object|String} args
 * @returns {Object}
 * @throws {TypeError} 'Cannot use type'
 * @private
 * */
Configurator.prototype._getType = function(args) {
    'use strict';

    var res = {
        type:     null,
        path:     null,
        ext:      null,
        dir:      null,
        fullpath: null
    };

    if( _.isObject( args ) ) {
        res.ext = path.extname( args.path );
        res.path = path.basename( args.path, res.ext );
        res.dir = (args.dir || '') + path.dirname( args.path );

        if( args.type ) {
            res.type = args.type.toLowerCase();

        } else {
            res.type = res.ext.slice( 1 ).toLowerCase(); //remove dot
        }

    } else if( _.isString( args ) ) {
        res.ext = path.extname( args );
        res.path = path.basename( args, res.ext );
        res.dir = path.dirname( args );
        res.type = res.ext.slice( 1 ).toLowerCase(); //remove dot

    } else {
        throw new TypeError( 'Cannot use type ' + (typeof args) );
    }

    res.fullpath = res.dir + path.sep + res.path + res.ext;

    return res;
};

/**
 * Normalizes a string or array into a key array according to the set separator token
 *
 * @param {String|Array} args
 * @returns {Array} key
 * @throws {TypeError} 'Key must be string or array'
 * @private
 * */
Configurator.prototype._getKey = function(args) {
    'use strict';

    if( _.isString( args ) ) {
        return args.split( this.options.separator );

    } else if( _.isArray( args ) ) {
        return args;

    } else {
        throw new TypeError( 'Key must be string or array' );
    }
};

/**
 * Simple shortcut function to recombine the key with the set separator
 *
 * @param key Array
 * @returns String
 * @private
 * */
Configurator.prototype._recombineKey = function(key) {
    "use strict";

    return key.join( this.options.separator );
};

/**
 * This takes a key and navigates to the object where the key should exist within.
 * NOTE: Does not return the object the key refers to, but the object it is contained within.
 *
 * 'create' argument specifies whether the function should create missing objects or fail
 *
 * @param {Array} key
 * @param {Boolean} create
 * @returns {Object|Null} Iterator
 * @private
 * */
Configurator.prototype._getIterator = function(key, create) {
    'use strict';

    var iterator = this.root;

    for( var i = 0, ii = key.length - 1; i < ii; i++ ) {
        var cur = key[i];

        if( iterator[cur] == null ) {
            if( create ) {
                iterator[cur] = {};

            } else {
                return null;
            }
        }

        iterator = iterator[cur];
    }

    return iterator;
};

/**
 * This function will insert the configuration loaded from a file and already parsed into the config tree
 *
 * @param {Array} key
 * @param {Object} file
 * @param {Object} value
 * @returns {Object} The config inserted
 * @private
 */
Configurator.prototype._insertConfig = function(key, file, value) {
    'use strict';

    var iterator = this._getIterator( key, true );

    if( this.options.storeMetadata ) {
        this.meta[this._recombineKey( key )] = file;
    }

    return iterator[_.last( key )] = value;
};

/**
 * Adds a store 'engine' to the Configurator instance,
 * allowing for the parsing of additional file types
 *
 * @param {Object} options
 * @throws {Error} Various errors caused by missing types and methods
 */
Configurator.prototype.addStore = function(options) {
    'use strict';

    var newStore = {};
    var storeType = null;

    if( _.isString( options.type ) ) {
        storeType = options.type;

    } else if( _.isString( options.extension ) ) {
        storeType = options.extension.slice( 1 );

    } else {
        throw new Error( 'No store type or extension given' );
    }

    if( _.isString( options.extension ) ) {
        newStore.extension = options.extension;

    } else {
        newStore.extension = '.' + storeType;
    }

    if( _.isFunction( options.parse ) ) {
        newStore.parse = options.parse;

    } else {
        throw new Error( 'No store parse method given' );
    }

    if( _.isFunction( options.stringify ) ) {
        newStore.stringify = options.stringify;

    } else {
        throw new Error( 'No store stringify method given' );
    }

    this.stores[storeType] = newStore;
};

/**
 * Loads a file from disk and parses it, loading it into the tree
 *
 * The arguments are flexible but must always be in this order:
 *  [optional] {Array or String} Key to place config at
 *  [required] {String or Object} Path or path options to load file from
 *
 *  Path options look like:
 * {
 *   path: String,
 *   dir: String,
 *   type: String
 * }
 *
 * @param arg1
 * @param arg2
 * @param {Function} cb callback provided if asynchronous file loading is desired
 * @returns {Object} If synchronous, the loaded and parsed configuration
 * @throws {Error} No store type found matching the file type
 */
Configurator.prototype.load = function(arg1, arg2, cb) {
    'use strict';

    var key, file, store, self = this;

    if( arg1 && (arg2 && !_.isFunction( arg2 )) ) {
        key = this._getKey( arg1 );
        file = this._getType( arg2 );

    } else {
        file = this._getType( arg1 );
        key = path.basename( file.path ).split( this.options.separator );

        if( _.isFunction( arg2 ) ) {
            cb = arg2;
        }
    }

    store = this.stores[file.type];

    if( store != null ) {

        if( _.isFunction( cb ) ) {
            fs.readFile( file.fullpath, 'utf8', function(err, content) {
                if( err ) {
                    cb( err );

                } else {
                    cb( self._insertConfig( key, file, store.parse( content ) ) );
                }
            } );

        } else {
            var content = fs.readFileSync( file.fullpath, 'utf8' );

            return this._insertConfig( key, file, store.parse( content ) );
        }

    } else {
        throw new Error( 'No store found for type ' + file.type );
    }
};

/**
 * Stores a configuration to disk, either automatically by previously stored location information
 * or by explicitly providing a path to store it at.
 *
 * The arguments are flexible but must always be in this order:
 *  [required] {Array or String} Key to load config from
 *  [optional] {String or Object} Path or path options to save file to
 *
 *  Path options look like:
 * {
 *   path: String,
 *   dir: String,
 *   type: String
 * }
 *
 * @param arg1
 * @param arg2
 * @param {Function} cb callback provided if asynchronous file saving is desired
 * @returns {Object} If synchronous, the loaded and parsed configuration
 * @throws {Error} No store type found matching the file type
 */
Configurator.prototype.store = function(arg1, arg2, cb) {
    'use strict';

    var key, file, store, value, self = this;

    if( arg1 && (arg2 && !_.isFunction( arg2 )) ) {
        key = this._getKey( arg1 );
        file = this._getType( arg2 );

    } else {
        key = this._getKey( arg1 );

        if( _.isFunction( arg2 ) ) {
            cb = arg2;
        }
    }

    value = this._getIterator( key );

    if( value != null ) {

        //get the real value
        value = value[_.last( key )];

        if( !file ) {

            if( this.options.storeMetadata ) {
                file = this.meta[this._recombineKey( key )];
            }

            if( !file ) {
                throw new Error( "Cannot save config, no path given" );
            }
        }

        store = this.stores[file.type];

        if( store ) {

            var content = store.stringify( value );

            if( _.isFunction( cb ) ) {
                fs.writeFile( file.fullpath, content, cb );

            } else {
                return fs.writeFileSync( file.fullpath, content );
            }

        } else {
            throw new Error( "Cannot save config, store " + file.type + " not found" );
        }

    } else {
        throw new Error( "Key " + key.join( this.option.separator ) + " not found" );
    }

};

/**
 * This moves configurations from one location to another
 *
 * @param {String|Array} fromKey
 * @param {String|Array} toKey
 */
Configurator.prototype.move = function(fromKey, toKey, merge) {
    "use strict";

    fromKey = this._getKey( fromKey );
    toKey = this._getKey( toKey );

    //Just a simple swap
    var tmp = this.get( fromKey );
    this.clear( fromKey );

    if( merge ) {
        this.merge( toKey, tmp );

    } else {
        this.set( toKey, tmp );
    }

    fromKey = this._recombineKey( fromKey );

    if( this.options.storeMetadata ) {
        //Take care of metadata if any
        var tmpMeta = this.meta[fromKey];

        if( tmpMeta ) {
            toKey = this._recombineKey( toKey );

            this.meta[fromKey] = null;
            delete this.meta[fromKey];

            this.meta[toKey] = tmpMeta;
        }
    }
};

/**
 * Merges a value into an existing configuration, placing the previous value in a
 * container key if it was a primitive
 *
 * @param {String|Array} key
 * @param {*} value
 * @param {String} replaceKey [optional] defaults to '_'
 * @returns {Object} The merged object
 */
Configurator.prototype.merge = function(key, value, replaceKey) {
    "use strict";

    var keys = this._getKey( key );

    var iterator = this._getIterator( keys, true );

    var newValue, lastValue = iterator[_.last( keys )];

    if( lastValue && !_.isObject( lastValue ) ) {
        replaceKey = replaceKey || '_';

        newValue = {};
        newValue[replaceKey] = lastValue;

    } else {
        newValue = lastValue || {};
    }

    return iterator[_.last( keys )] = _.merge( newValue, value );
};

/**
 * Sets the value at a key with a value
 *
 * @param {String|Array} key
 * @param {*} value
 * @returns The inserted value
 */
Configurator.prototype.set = function(key, value) {
    "use strict";

    var keys = this._getKey( key );

    var iterator = this._getIterator( keys, true );

    return iterator[_.last( keys )] = value;
};

/**
 * Gets the value associated with a key
 *
 * @param {String|Array} key
 * @returns {*}
 */
Configurator.prototype.get = function(key) {
    "use strict";

    var keys = this._getKey( key );

    var iterator = this._getIterator( keys, false );

    return iterator[_.last( keys )];
};

/**
 * Deletes a key-value pair
 *
 * @param {String|Array} key
 */
Configurator.prototype.clear = function(key) {
    "use strict";

    var keys = this._getKey( key );

    var iterator = this._getIterator( keys, false );

    iterator[_.last( keys )] = null;

    delete iterator[_.last( keys )];
};

/**
 * Completely resets the configuration tree, deleting everything
 */
Configurator.prototype.reset = function() {
    "use strict";

    this.root = {};

    if( this.options.storeMetadata ) {
        this.meta = {};
    }
};

/**
 * One-off function that creates a Configurator instance on the first call
 * then returns that instance each successive call
 *
 * @param {Object} options The same objects as the Configurator constructor
 * @returns {Configurator}
 */
Configurator.getMainConfig = _.once( function(options) {
    "use strict";

    return new Configurator( options );
} );

/**
 * Sets the module
 *
 * @type {Configurator}
 */
module.exports = Configurator;
