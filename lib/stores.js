/**
 * Created by novacrazy on 6/12/14.
 */

var ini = require( 'ini' );
var yaml = require( 'js-yaml' );

module.exports = {
    json: {
        parse:     JSON.parse,
        stringify: JSON.stringify,
        extension: '.json'
    },
    ini:  {
        parse:     ini.parse,
        stringify: ini.stringify,
        extension: '.ini'
    },
    yaml: {
        parse:     yaml.safeLoad,
        stringify: yaml.safeDump,
        extension: '.yaml'
    }
};
