'use strict';

var util = require('util');
var winston = require('winston');
var pg = require('pg').native;
var _ = require('lodash');

var Postgres = winston.transports.Postgres = function(options) {
  options = options || {};

  this.name = 'Postgres';

  this.level = options.level || 'info';

  if (!options.conString) {
    throw new Error('conString must be set for winston-pg-native');
  }

  this.conString = options.conString;

  this.tableConfig = options.tableConfig || {
    tableName: 'winston_logs',
    tableFields: ['level', 'msg', 'meta'].join(', ')
  };

  var sqlStatement = _.template('INSERT INTO ${ tableName } (${ tableFields }) VALUES ($1, $2, $3)');

  this.sqlStatement = options.sqlStatement || sqlStatement(options.tableConfig);
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

      callback(null, true);
      self.emit("logged");
    });
  });
};

module.exports = Postgres;