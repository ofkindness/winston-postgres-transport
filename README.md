winston-pg-native
=================

A Winston transport for PostgreSQL. Uses high performance native bindings between node.js and PostgreSQL via libpq. Using native bindings increases 20-30% in parsing speed.

## Installation

`npm install winston-pg-native`

You must have a table in your PostgreSQL database:

``` sql
CREATE TABLE winston_logs (
    ts timestamp default current_timestamp,
    lvl varchar,
    msg varchar,
    meta json
);
```

## Options

* __conString:__ The PostgreSQL connection string.
* __sqlStatement:__ A SQL statement that takes 3 parameters: level, message, metadata.
* __tableName:__ The name of a table with the following columns: level, message, metadata. Specifying `tableName` will override `sqlStatement`.
* __level:__ The winston log level, default "info"

You required to specify correct conString and either `sqlStatement` or a `tableName`. See the default values used in example:

``` js
var options = {
  "conString" : "postgres://username:password@localhost:5432/database",
  "sqlStatement": "SELECT logging($1, $2, $3)",
  "tableName": "winston_logs",
  "level" : "info"
};
```

## Usage 

``` js
'use strict';

var winston = require("winston");
var pgNative = require("winston-pg-native").pgNative;

var logger = new(winston.Logger)();

var options = {
  "conString" : "postgres://username:password@localhost:5432/database",
  "tableName": "winston_logs"
};

logger.add(pgNative, options);

module.exports = logger;
```

## AUTHORS

[AUTHORS](https://github.com/nololabout/winston-pg-native/blob/master/AUTHORS)

## LICENSE

MIT