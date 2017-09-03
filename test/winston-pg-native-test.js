/**
 * @module 'winston-pg-native-test'
 * @fileoverview Tests of winston transport for logging into PostgreSQL
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */

const Postgres = require('../lib/winston-pg-native.js');
const transport = require('winston/test/transports/transport');
const vows = require('vows');

const connectionString = `postgres://${process.env.PGUSER}\
:${process.env.PGPASSWORD}\
@${process.env.PGHOST}\
:${process.env.PGPORT}\
/${process.env.PGDATABASE}`;

vows.describe('winston-pg-native')
  .addBatch({
    'An instance of the Postgres Transport': transport(Postgres, {
      connectionString,
      poolConfig: {
        idleTimeoutMillis: 1
      }
    })
  })
  .export(module);
