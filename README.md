# winston-postgres-transport

[![CircleCI](https://circleci.com/gh/ofkindness/winston-postgres-transport/tree/master.svg?style=svg)](https://circleci.com/gh/ofkindness/winston-postgres-transport/tree/master)
[![NPM version](https://img.shields.io/npm/v/winston-postgres-transport.svg)](https://npmjs.org/package/winston-postgres-transport)
[![Dependency Status](https://david-dm.org/ofkindness/winston-postgres-transport.svg?theme=shields.io)](https://david-dm.org/ofkindness/winston-postgres-transport)
[![NPM Downloads](https://img.shields.io/npm/dm/winston-postgres-transport.svg)](https://npmjs.org/package/winston-postgres-transport)

A Winston transport for PostgreSQL. Based on on [Postgres](https://github.com/porsager/postgres) fully featured, lightweight PostgreSQL client for Node.js

## Installation

```console
  $ npm install winston
  $ npm install winston-postgres-transport
```

You must have a table in your PostgreSQL database, for example:

```sql
CREATE TABLE winston_logs
(
  level character varying,
  message character varying,
  meta json,
  timestamp timestamp without time zone DEFAULT now(),
)
```

## Options

- **level:** The winston's log level. Optional, default: `info`
- **name:** The winston's transport name. Optional, default: `Postgres`
- **postgresOptions:** Postgres specific [connection options](https://github.com/porsager/postgres#connection-options-postgresurl-options). Optional.
- **postgresUrl:** The PostgreSQL connection string. Required.
- **tableName:** PostgreSQL table name definition. Optional, default `winston_logs`

See the default values used:

```js
const options = {
  level: 'info',
  name: 'Postgres',
  postgresOptions: {
    // Is called with (connection, query, params)
    debug: console.log,
  },
  postgresUrl: 'postgres://username:password@localhost:5432/database',
  tableName: 'winston_logs',
};
```

## Usage

```js
const winston = require('winston');
const PostgresTransport = require('winston-postgres-transport');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new PostgresTransport({
      postgresUrl,
    }),
  ],
});

module.exports = logger;
```

## Logging

```js
logger.log({
  level: 'info',
  message: 'Hello there.',
});
```

## Querying Logs

This transport supports querying of logs with Loggly-like options. [See Loggly Search API](https://www.loggly.com/docs/api-retrieving-data/)

```js
const options = {
  fields: ['message'],
  from: new Date() - 24 * 60 * 60 * 1000,
  until: new Date(),
  limit: 10,
  order: 'ASC',
};

//
// Find items logged between today and yesterday.
//
logger.query(options, (err, results) => {
  if (err) {
    throw err;
  }

  console.log(results);
});
```

## Run Tests

The tests are written in [jest](https://jestjs.io/), and designed to be run with npm.

```bash
  $ npm test
```

## LICENSE

[MIT License](http://en.wikipedia.org/wiki/MIT_License)
