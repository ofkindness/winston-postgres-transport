/**
 * @module 'winston-postgres-test'
 * @fileoverview Tests of winston transport for logging into PostgreSQL
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */
const { config } = require('dotenv');

const logTestSuite = require('./suite/log');
const Transport = require('../winston-postgres-transport');

config();

logTestSuite('Postgres', Transport, {
  postgresUrl: `postgres://${process.env.PGUSER}\
:${process.env.PGPASSWORD}\
@${process.env.PGHOST}\
:${process.env.PGPORT}\
/${process.env.PGDATABASE}`,
});
