/**
 * @module 'pg-test'
 * @fileoverview Tests of winston transport for logging into PostgreSQL
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */

const logSuite = require('abstract-winston-transport');

// const querySuit = require('./suite/query');
const Transport = require('../lib/winston-pg-transport');

const name = 'Postgres';

const construct = {
  connection: `postgres://${process.env.PGUSER}\
 :${process.env.PGPASSWORD}\
 @${process.env.PGHOST}\
 :${process.env.PGPORT}\
 /${process.env.PGDATABASE}`,
  name,
  poolConfig: {
    idleTimeoutMillis: 1,
  },
};

const pgTransport = new Transport(construct);

describe(name, () => {
  before(() => pgTransport.init());

  logSuite({
    name: 'Postgres',
    Transport,
    construct,
  });

  // querySuit({
  //   transport: pgTransport,
  // });
});
