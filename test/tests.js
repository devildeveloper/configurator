/**
 * Created by novacrazy on 6/12/14.
 */

var assert = require( "assert" );
var _ = require( 'lodash' );


var Configurator, config, undefined;

var levelOne = 'test_variable';
var multiLevel = 'test/do/something';
var multiLevelPath = ['do', 'something', 'else'];

var testObject = {
    script: true,
    other:  "test"
};


describe( "Require Configurator", function() {
    "use strict";

    Configurator = require( './../' );

    assert( Configurator );
} );

describe( "Create default Configurator instance", function() {
    "use strict";

    config = Configurator.getMainConfig();

    assert( config instanceof Configurator );
    assert.notEqual( config.options, null );
} );

describe( "Level one variables", function() {
    "use strict";

    it( "should store", function() {
        "use strict";

        config.set( levelOne, 1337 );

        assert.equal( config.get( levelOne ), 1337 );
    } );

    it( "should clear", function() {
        "use strict";

        config.clear( levelOne );

        assert.equal( config.get( levelOne ), null );
    } )

} );

describe( "Multi-level variable", function() {
    "use strict";

    it( 'should parse paths', function() {
        "use strict";

        config.set( multiLevel, 1337 );

        assert.equal( config.get( multiLevel ), 1337 );
    } );

    it( 'should accept arrays', function() {
        "use strict";

        config.set( multiLevelPath, testObject );

        assert.deepEqual( config.get( multiLevelPath ), testObject );
    } );

} );

describe( 'test extremely deep configurations', function() {

    var alpha = 'abcdefghijklmnopqrstuvwxyz';

    var path = '';

    for( var i = 0; i < 10000; i++ ) {
        path += alpha.charAt( _.random( 0, alpha.length - 1 ) ) + config.options.separator;
    }

    it( 'should store a long path', function() {
        "use strict";

        var ret = config.set( path, 1337 );

        assert.equal( ret, 1337 );
    } );

    it( 'should get a long path', function() {
        "use strict";

        var ret = config.get( path );

        assert.equal( ret, 1337 );
    } )

} );

describe( "Loading configurations from file", function() {
    "use strict";

    it( 'should load in a simple INI file', function() {
        "use strict";

        config.load( './test/resources/test.ini' );

        assert.equal( config.get( 'test/section/database/user' ), 'dbuser' );
        assert.equal( config.get( 'test/section/database/database' ), 'use_another_database' );

        //etc
    } );

    it( 'should load in a simple INI file asynchronously', function(done) {
        "use strict";

        config.load( './test/resources/test.ini', function(ini_config) {

            assert( _.isObject( ini_config ) );

            done();
        } );

    } );

    it( 'should load a YAML file with advanced options', function() {
        "use strict";

        config.load( 'developer', {
            type: 'YAML',
            path: 'test.yaml',
            dir:  './test/resources/'
        } );

        assert.equal( config.get( 'developer/job' ), 'Developer' );
    } );
} );


describe( 'altering loaded configurations', function() {
    "use strict";

    it( 'should toggle developer/employed', function() {
        "use strict";

        var employed = config.get( 'developer/employed' );

        assert( _.isBoolean( employed ) );

        config.set( 'developer/employed', !employed );

        assert.notEqual( config.get( 'developer/employed' ), employed );
    } );

} );

describe( 'saving file configurations', function() {
    "use strict";

    it( 'should save the YAML config loaded earlier', function() {
        config.store( 'developer' );

    } );

} );

describe( 'using null as a value', function() {
    "use strict";

    it( 'should store null', function() {
        "use strict";


        var ret = config.set( 'test/null', null );

        assert.strictEqual( ret, null );
        assert.notStrictEqual( ret, undefined );
    } );

    it( 'should get null', function() {
        "use strict";

        var ret = config.get( 'test/null' );

        assert.strictEqual( ret, null );
        assert.notStrictEqual( ret, undefined );
    } );

    it( 'should be undefined after clear', function() {
        "use strict";

        config.clear( 'test/null' );

        var ret = config.get( 'test/null' );

        assert.strictEqual( ret, undefined );
        assert.notStrictEqual( ret, null );
    } );
} );
