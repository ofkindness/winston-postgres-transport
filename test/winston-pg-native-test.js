'use strict';
/**
 * @module 'winston-pg-native-test'
 * @fileoverview Tests of winston transport for logging into PostgreSQL
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */

var vows = require('vows');
var transport = require('winston/test/transports/transport');
var Postgres = require('../lib/winston-pg-native');
// var Promise = require('bluebird');
// var winston = require('winston');
// var pg = require('pg').native;

var conString = "postgres://" + process.env.POSTGRES_USER +
  ":" + process.env.POSTGRES_PASSWORD +
  "@" + process.env.POSTGRES_HOST +
  ":" + process.env.POSTGRES_PORT +
  "/" + process.env.POSTGRES_DBNAME;

vows.describe('winston-pg-native')
  .addBatch({
    'An instance of the Postgres Transport': transport(Postgres, {
      conString: conString,
      tableConfig: {
        tableName: 'winston_logs',
        tableFields: 'level, msg, meta'
      },
      level: 'info'
    })
  })
  // .addBatch({
  // 'An instance of the Postgres Transport with promise':
  //     transport(Postgres, {
  //       conString: new Promise(function(resolve, reject) {
  //         pg.connect(conString,
  //             function(err, db) {
  //               if (err) {
  //                 reject(err);
  //               } else {
  //                 resolve(db);
  //               }
  //             });
  //       })
  //     })
  // })
  .export(module);
