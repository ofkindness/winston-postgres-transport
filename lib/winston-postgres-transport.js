/**
 * @module 'winston-postgres-transport'
 * @fileoverview Winston transport for logging into PostgreSQL
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */
const moment = require('moment');
const postgres = require('postgres');
const Transport = require('winston-transport');
const { callbackify } = require('util');

const { handleCallback } = require('./helpers');

/**
 * Class for the Postgres transport object.
 * @class
 * @param {Object} options
 * @param {String} [options.level=info] - Level of messages that this transport
 * should log.
 * @param {Boolean} [options.silent=false] - Boolean flag indicating whether to
 * suppress output.
 * @param {String} options.conString - Postgres connection uri
 * @param {String} [options.tableName='winston_logs'] - The name of the table you
 * want to store log messages in.
 * @param {Array} [options.tableFields=['level', 'msg', 'meta']] - array of the table fields
 * @param {String} [options.label] - Label stored with entry object if defined.
 * @param {String} [options.name] - Transport instance identifier. Useful if you
 * need to create multiple Postgres transports.
 */
class PostgresTransport extends Transport {
  constructor(options = {}) {
    super();

    const {
      label = '',
      level = 'info',
      silent = false,
      table = [
        {
          dataType: 'character varying',
          name: 'level',
        },
        {
          dataType: 'character varying',
          name: 'message',
        },
        {
          dataType: 'json',
          name: 'meta',
        },
        {
          dataType: 'timestamp without time zone',
          default: 'DEFAULT NOW()',
          name: 'timestamp',
        },
      ],
      tableName = 'winston_logs',
      postgresOptions = {},
      postgresUrl,
    } = options;

    //
    // Configure postgres
    //
    if (!postgresUrl) {
      throw new Error('You have to define url connection string');
    }

    const sql = postgres(postgresUrl, postgresOptions);

    const tableFields = table.map((tableField) => tableField.name);

    Object.assign(this, {
      label,
      level,
      silent,
      sql,
      table,
      tableFields,
      tableName,
    });
  }

  /**
   * Create logs table method.
   * @return {Promise} result of creation within a Promise
   */
  init() {
    const { sql, tableFields, tableName } = this;

    return sql`CREATE TABLE IF NOT EXISTS ${sql(tableName)} (
        ${sql(tableFields[0])} character varying,
        ${sql(tableFields[1])} character varying,
        ${sql(tableFields[2])} json,
        ${sql(tableFields[3])} timestamp without time zone DEFAULT NOW()
    );`;
  }

  /**
   * End the connection
   * Return a Promise which resolves when all queries are finished and the underlying connections are closed.
   * @return {Promise} result within a Promise
   */
  end(timeout = 0) {
    return this.sql.end({ timeout });
  }

  /**
   * Flush all logs
   * Return a Promise which resolves when all logs are finished.
   * @return {Promise} result within a Promise
   */
  flush() {
    const { sql, tableName } = this;
    return sql`DELETE FROM ${sql(tableName)};`;
  }

  /**
   * Core logging method exposed to Winston. Metadata is optional.
   * @param {Object} info
   * @param {string} [info.level] - Level at which to log the message.
   * @param {string} [info.message] - Message to log
   * @param {Function} callback - Continuation to respond to when complete.
   */
  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    if (this.silent !== true) {
      const { defaultMeta, sql, tableFields, tableName } = this;
      const { level, message, ...meta } = info;

      const log = {
        level,
        message,
        meta: JSON.stringify({ ...meta, ...defaultMeta }),
        timestamp: 'NOW()',
      };

      const logQuery = async () => {
        await sql`INSERT INTO ${sql(tableName)} ${sql(log, ...tableFields)}`;
      };

      logQuery((error) => {
        if (error) {
          return handleCallback(callback, error);
        }

        return handleCallback(callback, null, true);
      });
    }
  }

  /**
   * Query the transport. Options object is optional.
   * @param {Object} options - Loggly-like query options for this instance.
   * @param {string} [options.from=epoch] - offset time for the search. Defaults to "epoch".
   * @param {string} [options.until=now] - End time for the search. Defaults to "now".
   * @param {string} [options.rows=100] - Limited number of rows returned by search. Defaults to 100.
   * @param {string} [options.order=desc] - Direction of results returned, either "asc" or "desc".
   * @param {string} [options.fields]
   * @param {Function} callback - Continuation to respond to when complete.
   */
  query(options = {}, callback) {
    const { sql, tableFields, tableName } = this;

    const {
      fields = [],
      from = new Date(0),
      until = new Date(),
      order = 'DESC',
      rows = 100,
    } = options;

    let filteredFields = tableFields;

    if (fields.length > 0) {
      filteredFields = filteredFields.filter((field) => fields.includes(field));
    }

    const queryQuery = callbackify(
      () => sql`SELECT ${sql(filteredFields)}
    FROM ${sql(tableName)}
    WHERE ${sql(tableFields[3])} >= ${moment(from)
        .utc()
        .format('YYYY-MM-DD HH:mm:ss.SSS')} 
    AND ${sql(tableFields[3])} < ${moment(until)
        .utc()
        .format('YYYY-MM-DD HH:mm:ss.SSS')}
    ORDER BY ${sql(tableFields[3])} ${sql(order)}
    LIMIT ${sql(rows)};`
    );

    queryQuery((error, data) => {
      if (error) {
        return handleCallback(callback, error);
      }
      return handleCallback(callback, null, data);
    });
  }
}

module.exports = PostgresTransport;
