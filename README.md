# winston-pg-native

[![NPM version](https://img.shields.io/npm/v/winston-pg-native.svg)](https://npmjs.org/package/winston-pg-native)
[![Dependency Status](https://david-dm.org/ofkindness/winston-pg-native.svg?theme=shields.io)](https://david-dm.org/ofkindness/winston-pg-native)
[![NPM Downloads](https://img.shields.io/npm/dm/winston-pg-native.svg)](https://npmjs.org/package/winston-pg-native)

A Winston transport for PostgreSQL. Uses high performance of native bindings via libpq.

## Installation

```console
  $ npm install winston
  $ npm install winston-pg-native
```

You must have a table in your PostgreSQL database, for example:

```sql
CREATE SEQUENCE serial START 1;

CREATE TABLE winston_logs
(
  id integer PRIMARY KEY DEFAULT nextval('serial'),
  timestamp timestamp without time zone DEFAULT now(),
  level character varying,
  message character varying,
  meta json
)
```

## Options

-	**connectionString:** The PostgreSQL connection string. Required.
-	**level:** The winston's log level. Optional, default: info
-	**tableFields:** PostgreSQL table fields definition. Optional. You can use Array or a comma separated String.
-	**tableName:** PostgreSQL table name definition. Optional.

See the default values used:

```js
const options = {
  connectionString: 'postgres://username:password@localhost:5432/database',
  level: 'info',
  tableFields: ['level', 'message', 'meta']
  tableName: 'winston_logs',
};
```

## Usage

```js
const winston = require('winston');
require('winston-pg-native');

const logger = new(winston.Logger)({
  transports: [
    new(winston.transports.Postgres)({
      connectionString: 'postgres://username:password@localhost:5432/database',
      level: 'info',
      tableFields: ['level', 'message', 'meta']
      tableName: 'winston_logs',
      }
    })
  ]
});

module.exports = logger;
```

```js
logger.log('info', 'message', {});
```

## Run Tests

The tests are written in [vows](http://vowsjs.org), and designed to be run with npm.

```bash
  $ npm test
```

## LICENSE

[MIT License](http://en.wikipedia.org/wiki/MIT_License)
