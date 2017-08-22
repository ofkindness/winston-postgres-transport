/**
 * @module 'winston-pg-native-test'
 * @fileoverview Tests of winston transport for logging into PostgreSQL
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */

const vows = require('vows');
const transport = require('winston/test/transports/transport');
const Postgres = require('../lib/winston-pg-native.js');

vows.describe('winston-pg-native')
  .addBatch({
    'An instance of the Postgres Transport': transport(Postgres, {
      connectionString: `postgres://${process.env.POSTGRES_USER}\
:${process.env.POSTGRES_PASSWORD}\
@${process.env.POSTGRES_HOST}\
:${process.env.POSTGRES_PORT}\
/${process.env.POSTGRES_DBNAME}`
    })
  })
  .export(module);
