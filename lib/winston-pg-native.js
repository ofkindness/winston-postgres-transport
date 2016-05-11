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
var prepareMetaData = require('./helpers.js').prepareMetaData;

var Postgres = winston.transports.Postgres = function(options) {
  options = options || {};

  this.name = 'Postgres';

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

module.exports = Postgres;

var sqlStatement = function(tableName, tableFields) {

  if (!tableName || !tableFields) {
    throw new Error('You have to define tableName and tableFields');
  }

  if (tableFields instanceof Array) {
    tableFields = tableFields.join(', ');
  }

  return util.format('INSERT INTO %s (%s) VALUES ($1, $2, $3)', tableName,
    tableFields);
};
