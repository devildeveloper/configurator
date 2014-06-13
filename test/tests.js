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

        config.set( multiLevel, 1337 );

        assert.equal( config.get( multiLevel ), 1337 );
    } );

    it( 'should accept arrays', function() {

        config.set( multiLevelPath, testObject );

        assert.deepEqual( config.get( multiLevelPath ), testObject );
    } );

} );

describe( "Loading configurations from file", function() {
    "use strict";

    it( 'should load in a simple INI file', function() {
        config.load( './test/resources/test.ini' );

        assert.equal( config.get( 'test/section/database/user' ), 'dbuser' );
        assert.equal( config.get( 'test/section/database/database' ), 'use_another_database' );

        //etc
    } );

    it( 'should load in a simple INI file asynchronously', function(done) {

        config.load( './test/resources/test.ini', function(ini_config) {
            done();
        } );

    } );

    it( 'should load a YAML file with advanced options', function() {

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
