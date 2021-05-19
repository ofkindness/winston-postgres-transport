/**
 * @module 'winston-postgres-transport'
 * @fileoverview Winston transport for logging into PostgreSQL
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */
const moment = require('moment');
const postgres = require('postgres');
const { Stream } = require('stream');
const Transport = require('winston-transport');

const handleCallback = (callback, ...args) => {
  console.log({ args });
  if (callback && typeof callback === 'function') {
    callback(...args);
  }
};

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
class Postgres extends Transport {
  constructor(options = {}) {
    super();

    const {
      defaultMeta = {},
      label = '',
      level = 'info',
      silent = false,
      tableFields = [
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

    Object.assign(this, {
      defaultMeta,
      label,
      level,
      silent,
      sql,
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
        ${sql(tableFields[0].name)} character varying,
        ${sql(tableFields[1].name)} character varying,
        ${sql(tableFields[2].name)} json,
        ${sql(tableFields[3].name)} timestamp without time zone DEFAULT NOW()
    );`;
  }

  /**
   * End the connection
   * Return a Promise which resolves when all queries are finished and the underlying connections are closed.
   * @return {Promise} result within a Promise
   */
  end() {
    return this.sql.end();
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
  async log(info, callback) {
    const { defaultMeta, silent, sql, tableFields, tableName } = this;
    const { level, message, ...meta } = info;

    const log = {
      level,
      message,
      meta: JSON.stringify({ ...meta, ...defaultMeta }),
      timestamp: 'NOW()',
    };

    if (silent) {
      return handleCallback(callback, null, true);
    }

    try {
      await sql`INSERT INTO ${sql(tableName)} ${sql(
        log,
        ...tableFields.map((tableField) => tableField.name)
      )}`;
      return handleCallback(callback, null, true);
    } catch (error) {
      return handleCallback(callback, error);
    } finally {
      this.emit('logged', info);
    }
  }

  /**
   * Query the transport. Options object is optional.
   * @param {Object} options - Loggly-like query options for this instance.
   * @param {string} [options.from=epoch] - Start time for the search. Defaults to "epoch".
   * @param {string} [options.until=now] - End time for the search. Defaults to "now".
   * @param {string} [options.rows=100] - Limited number of rows returned by search. Defaults to 100.
   * @param {string} [options.order=desc] - Direction of results returned, either "asc" or "desc".
   * @param {string} [options.fields]
   * @param {Function} callback - Continuation to respond to when complete.
   */
  async query(options = {}, callback) {
    const { sql, tableFields, tableName } = this;

    const {
      fields = [],
      from = new Date(0),
      until = new Date(),
      order = 'DESC',
      rows = 100,
    } = options;

    let filteredFields = tableFields.map((tableField) => tableField.name);

    if (fields.length > 0) {
      filteredFields = filteredFields.filter((value) => fields.includes(value));
    }

    try {
      const data = await sql`SELECT ${sql(filteredFields)}
      FROM ${sql(tableName)}
      WHERE ${sql(tableFields[3].name)} >= ${moment(from)
        .utc()
        .format('YYYY-MM-DD HH:mm:ss.SSS')} 
      AND ${sql(tableFields[3].name)} < ${moment(until)
        .utc()
        .format('YYYY-MM-DD HH:mm:ss.SSS')}
      ORDER BY ${sql(tableFields[3].name)} ${sql(order)}
      LIMIT ${sql(rows)};`;

      return handleCallback(callback, null, data);
    } catch (error) {
      return handleCallback(callback, error);
    }
  }

  /**
   * Returns a log stream for this transport. Options object is optional.
   * @param {Object} options Stream options for this instance.
   * @param {Stream} stream Pass in a pre-existing stream.
   * @return {Stream}
   */
  stream(options = {}, stream = new Stream()) {
    const { pool, table } = this;

    let start = typeof options.start === 'undefined' ? null : options.start;
    let row = 0;

    if (start === -1) {
      start = null;
    }

    stream.destroy = function destroy() {
      this.destroyed = true;
    };

    function poll(offset) {
      let query = table.select(table.star()).from(table);

      if (offset) {
        query = query.offset(offset);
      }

      query = query.toQuery();

      return pool.connect().then((client) =>
        client
          .query(query)
          .then((result) => {
            client.release();

            if (stream.destroyed) {
              return null;
            }

            const rows =
              result && result.rows instanceof Array ? result.rows : [];
            rows.forEach((log) => {
              if (start === null || row > start) {
                stream.emit('log', log);
              }
              row += 1;
            });

            return setTimeout(poll, 2000);
          })
          .catch((e) => {
            client.release();

            if (stream.destroyed) {
              return null;
            }

            stream.emit('error', e.stack);

            return setTimeout(poll, 2000);
          })
      );
    }

    // we need to poll here.
    poll(start);

    return stream;
  }
}

module.exports = Postgres;
