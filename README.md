winston-pg-native
=================

A Winston transport for PostgreSQL. Uses high performance native bindings between node.js and PostgreSQL via libpq. 

## Upgrading from 1.3.* to 2.0
  - [Upgrade Tips](https://github.com/nololabout/winston-pg-native/wiki/Upgrading-to-2.x)

## Installation

  - Latest release:

    $ npm install winston-pg-native


You must have a table in your PostgreSQL database, for example:

``` sql 
CREATE TABLE winston_logs (
    ts timestamp default current_timestamp,
    level varchar,
    msg varchar,
    meta json
);
```

## Options

* __conString:__ The PostgreSQL connection string. Required.
* __tableConfig:__ Optional object with tableName and tableFields properties, both required.
* __sqlStatement:__ Optional SQL statement that takes 3 parameters: level, msg, meta. Specifying `sqlStatement` will override `tableConfig` settings.
* __level:__ The winston's log level, default: "info"
 
Either you can use `sqlStatement` or a `tableConfig`.

See the default values used:

``` js
var options = {
  conString: "postgres://username:password@localhost:5432/database",
  tableConfig: {
    tableName: 'winston_logs',
    tableFields: 'level, msg, meta'
  },
  level: 'info'
};
```

## Usage 


``` js
'use strict';

var winston = require("winston");
require("winston-pg-native");

var logger = new(winston.Logger)({
  transports: [
    new(winston.transports.Postgres)({
      conString: "postgres://username:password@localhost:5432/database",
      tableConfig: {
        tableName: 'winston_logs',
        tableFields: 'level, msg, meta'
      },
      level: 'info'
    })
  ]
});

module.exports = logger;
```


``` js

logger.log('info', 'message', {});

```

## AUTHORS

[AUTHORS](https://github.com/nololabout/winston-pg-native/blob/master/AUTHORS)

## LICENSE

MIT