'use strict';

var postgres = require('pg').native;
var util = require("util");
var winston = require("winston");

var pgNative = exports.pgNative = function(options) {

  if ((typeof options === 'object')) {

    winston.Transport.call(this, options);
    this.name = 'pgNative';

    if(options.conString) {
      this.conString = options.conString;
    } else {
      throw new Error('winston-pg-native transport requires correct conString');
    }

    if (options.tableName || options.sqlStatement) {
      this.sql = options.tableName ?
        "INSERT INTO " + options.tableName + " (level, msg, meta) values ($1, $2, $3)" :
        options.sqlStatement;
    } else {
      throw new Error('winston-pg-native transport requires tableName or sqlStatement.');
    }
  } else {
    throw new Error('winston-pg-native transport requires options object');
  }
};

// 
// Inherit from Winston.Transport
//
util.inherits(pgNative, winston.Transport);
//
// Expose the name of this Transport on the prototype
//
pgNative.prototype.name = 'pgNative';
//
// Define a getter so that `winston.transports.pgNative`
// is available and thus backwards compatible.
//
winston.transports.pgNative = pgNative;

pgNative.prototype.log = function(lvl, msg, meta, callback) {
  var self = this;

  // use connection pool
  postgres.connect(self.conString, function(err, client, done) {
    // fetching a connection from the pool, emit error if failed.
    if (err) {
      self.emit("error", err);
      return callback(err);
    }
    // query 
    client.query(self.sql, [lvl, msg, meta instanceof Array ? JSON.stringify(meta) : meta], function(err) {
      //call `done()` to release the client back to the pool
      done();
      // executing statement, emit error if failed.
      if (err) {
        self.emit("error", err);
        return callback(err);
      }
      // acknowledge successful logging event
      callback(null, true);
      self.emit("logged");
    });
  });
};