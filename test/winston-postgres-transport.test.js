/**
 * @module 'winston-postgres-test'
 * @fileoverview Tests of winston transport for logging into PostgreSQL
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */
const { config } = require('dotenv');
const util = require('util');

const Transport = require('../lib/winston-postgres-transport');

const name = 'Postgres';

config();

const construct = {
  postgresUrl: `postgres://${process.env.PGUSER}\
:${process.env.PGPASSWORD}\
@${process.env.PGHOST}\
:${process.env.PGPORT}\
/${process.env.PGDATABASE}`,
  postgresOptions: {
    debug: (...args) => {
      util.inspect(args);
    },
  },
};

describe(name, () => {
  const pgTransport = new Transport(construct);

  beforeAll(() => pgTransport.init());

  test('', () =>
    pgTransport.log({
      level: 'debug',
      message: 'foo',
      meta: {},
    }));
});
