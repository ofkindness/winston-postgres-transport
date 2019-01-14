/**
 * @module 'winston-pg-native-test'
 * @fileoverview Tests of winston transport for logging into PostgreSQL
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */
const assert = require('assert');
const { Logger } = require('winston');
const vows = require('vows');

const transport = require('winston/test/transports/transport');
const Postgres = require('../lib/winston-pg-native.js');

const options = {
  connectionString: `postgres://${process.env.PGUSER}\
:${process.env.PGPASSWORD}\
@${process.env.PGHOST}\
:${process.env.PGPORT}\
/${process.env.PGDATABASE}`,
  poolConfig: {
    idleTimeoutMillis: 1
  }
};

vows.describe('winston-pg-native')
  .addBatch({
    'An instance of the Postgres Transport': {
      topic: function topic() {
        const logger = new Logger({
          transports: [
            new Postgres(options)
          ]
        }).transports.Postgres;
        const { callback } = this;
        logger.init().then(() => callback(null, true));
      },
      'should create table': (err, result) => {
        assert.isNull(err);
        assert.ok(result === true);
      }
    }
  })
  .addBatch({
    'An instance of the Postgres Transport': transport(Postgres, options)
  })
  .export(module);
