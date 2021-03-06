'use strict';

const XRegExp = require('xregexp');

const patterns = require('../patterns');

let matchPattern = (str, cb) => {
    let getResult = patterns.find(item => {
        if (XRegExp.test(str, XRegExp(item.pattern, "i"))) { 
            return true ; }
    }) ;

    let createEntities = (str, pattern) => {
        return XRegExp.exec(str, XRegExp(pattern, "i"))
    }

    if (getResult) {
        return cb ({ 
            intent : getResult.intent,
            entities : createEntities(str, getResult.pattern)
        }) ;
    }
    else { return cb ({}); }
}

module.exports = matchPattern ;