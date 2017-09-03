/**
 * @module 'winston-pg-native-test'
 * @fileoverview Tests of winston transport for logging into PostgreSQL
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */

const Postgres = require('../lib/winston-pg-native.js');
const transport = require('winston/test/transports/transport');
const vows = require('vows');
const winston = require('winston');

const connectionString = `postgres://${process.env.POSTGRES_USER}\
:${process.env.POSTGRES_PASSWORD}\
@${process.env.POSTGRES_HOST}\
:${process.env.POSTGRES_PORT}\
/${process.env.POSTGRES_DBNAME}`;

vows.describe('winston-pg-native')
  .addBatch({
    'An instance of the Postgres Transport': transport(Postgres, {
      connectionString
    })
  })
  .addBatch({
    'An instance of the Postgres Transport': {
      topic: new winston.Logger({
        transports: [
          new Postgres({
            connectionString
          })
        ]
      })
    }
  })
  .export(module);
