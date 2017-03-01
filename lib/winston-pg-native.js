'use strict';
/**
 * @module 'winston-pg-native'
 * @fileoverview Winston transport for logging into PostgreSQL
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 * @author Jeffrey Yang <jeffrey.a.yang@gmail.com>
 */

var util = require('util');
var winston = require('winston');
var pg = require('pg').native;
var Stream = require('stream').Stream;
var prepareMetaData = require('./helpers.js').prepareMetaData;
var sqlStatement = require('./helpers.js').sqlStatement;

var Postgres = winston.transports.Postgres = function(options) {
  options = options || {};

  this.name = options.name || 'Postgres';

  this.level = options.level || 'info';

  if (!options.conString) {
    throw new Error('You have to define conString');
  }

  this.conString = options.conString;

  var tableConfig = options.tableConfig || {
    tableName: 'winston_logs',
    tableFields: 'level, msg, meta'
  };

  this.sqlStatement = options.sqlStatement || sqlStatement(tableConfig.tableName,
    tableConfig.tableFields);
};

util.inherits(Postgres, winston.Transport);

Postgres.prototype.name = 'Postgres';

/**
 * Core logging method exposed to Winston. Metadata is optional.
 * @param {string} level Level at which to log the message.
 * @param {string} msg Message to log
 * @param {Object=} meta Metadata to log
 * @param {Function} callback Continuation to respond to when complete.
 */
Postgres.prototype.log = function(level, msg, meta, callback) {
  var self = this;

  if (this.silent) {
    return callback(null, true);
  }

  pg.connect(self.conString, function(err, client, done) {
    if (err) {
      self.emit("error", err);
      return callback(err);
    }

    switch (typeof meta) {
      case 'boolean':
      case 'number':
      case 'string':
      case 'symbol':
      case 'function':
        meta = JSON.stringify(meta);
        break;
      case 'undefined':
      case 'object':
        meta = prepareMetaData(meta);
        break;
      default:
        break;
    }

    var query = client.query(self.sqlStatement, [level, msg, meta instanceof Array ?
      JSON.stringify(meta) : meta
    ]);

    query.on('error', function(err) {
      self.emit("error", err);
      return callback(err);
    });

    query.on('end', function() {
      self.emit("logged");
      return callback(null, true);
    });

    done();
  });
};

/**
 * Returns a log stream for this transport. Options object is optional.
 * @param {Object} options Stream options for this instance.
 * @param {Stream} stream Pass in a pre-existing stream.
 * @return {Stream}
 */
Postgres.prototype.stream = function(options, stream) {
  options = options || {};
  stream = stream || new Stream();
  var self = this;
  var start = options.start;
  console.log(stream, self, start);

  stream.destroy = function() {
    this.destroyed = true;
  };

  if (start === -1) {
    start = null;
  }

  if (start !== null) {

    return stream;
  }
  return stream;
};

module.exports = Postgres;
