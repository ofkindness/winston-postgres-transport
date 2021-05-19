/**
 * @module 'winston-postgres-test'
 * @fileoverview Tests of winston transport for logging into PostgreSQL
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */
const { config } = require('dotenv');

const logTestSuite = require('./suite/log');
const queryTestSuite = require('./suite/query');
const streamTestSuite = require('./suite/stream');
const Transport = require('../winston-postgres-transport');

config();

const transportConfig = {
  postgresUrl: `postgres://${process.env.PGUSER}\
:${process.env.PGPASSWORD}\
@${process.env.PGHOST}\
:${process.env.PGPORT}\
/${process.env.PGDATABASE}`,
  postgresOptions: {
    debug: console.log,
  },
};

describe('Postgres', () => {
  const transport = new Transport(transportConfig);

  beforeAll(() => transport.init());

  logTestSuite(transport);

  queryTestSuite(transport);

  streamTestSuite(transport);

  afterAll(() => transport.end());
});
