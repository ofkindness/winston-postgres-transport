'use strict';

var util = require('util');
var winston = require('winston');
var pg = require('pg').native;

var Postgres = winston.transports.Postgres = function(options) {
  options = options || {};

  this.name = 'Postgres';

  this.level = options.level || 'info';

  if (!options.conString) {
    throw new Error('conString must be set for winston-pg-native');
  }

  this.conString = options.conString;

  var tableConfig = options.tableConfig || {
    tableName: 'winston_logs',
    tableFields: 'level, msg, meta'
  };

  this.sqlStatement = options.sqlStatement || sqlStatement(tableConfig.tableName, tableConfig.tableFields);
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
    
    client.query(self.sqlStatement, [level, msg, meta instanceof Array ? JSON.stringify(meta) : meta], function(err) {

      done();

      if (err) {
        self.emit("error", err);
        return callback(err);
      }

      self.emit("logged");
      return callback(null, true);
    });
  });
};

module.exports = Postgres;

var sqlStatement = function(tableName, tableFields) {

  if (!tableName || !tableFields) {
    throw new Error('tableName and tableFields must be set for winston-pg-native');
  }

  if (tableFields instanceof Array) {
    tableFields = tableFields.join(', ')
  }

  return util.format('INSERT INTO %s (%s) VALUES ($1, $2, $3)', tableName, tableFields);
};