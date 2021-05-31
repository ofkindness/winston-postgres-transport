/**
 * @module 'winston-postgres-test'
 * @fileoverview Tests of winston transport for logging into PostgreSQL
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */
const { config } = require('dotenv');
const { debuglog } = require('util');

const logTestSuite = require('./suite/log');
const queryTestSuite = require('./suite/query');
const PostgresTransport = require('../winston-postgres-transport');

config();
debuglog('postgres');

const transportConfig = {
  postgresUrl: `postgres://${process.env.PGUSER}\
:${process.env.PGPASSWORD}\
@${process.env.PGHOST}\
:${process.env.PGPORT}\
/${process.env.PGDATABASE}`,
  debug: debuglog,
};

describe('Postgres', () => {
  const transport = new PostgresTransport(transportConfig);

  beforeAll(() => transport.init());

  logTestSuite(transport);

  queryTestSuite(transport);

  afterAll(() => transport.end());
});
