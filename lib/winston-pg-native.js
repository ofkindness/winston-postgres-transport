/**
 * @module 'winston-pg-native'
 * @fileoverview Winston transport for logging into PostgreSQL
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 * @author Jeffrey Yang <jeffrey.a.yang@gmail.com>
 */

const circularJSON = require('circular-json');
const { Client, Pool } = require('pg').native;
const moment = require('moment');
const sql = require('sql');
const Stream = require('stream').Stream;
const winston = require('winston');

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
class Postgres extends winston.Transport {
  constructor(options = {}) {
    super();
    //
    // Name this logger
    //
    this.name = options.name || 'Postgres';
    //
    // Set the level from your options
    //
    this.level = options.level || 'info';

    this.silent = options.silent || false;

    options.tableConfig = options.tableConfig ? options.tableConfig : {};

    const tableName = options.tableConfig.tableName || options.tableName || 'winston_logs';

    let tableFields = options.tableConfig.tableFields || options.tableFields ||
      ['level', 'message', 'meta'];

    tableFields = (tableFields instanceof Array) ? tableFields : tableFields.split(', ');

    tableFields.unshift('timestamp');

    this.table = sql.define({
      name: tableName,
      columns: tableFields
    });

    this.sqlStatement = options.sqlStatement || `INSERT INTO ${tableName} (${tableFields}) VALUES ($1, $2, $3, $4)`;

    //
    // Configure storage
    //
    if (!options.conString && !options.connectionString) {
      throw new Error('You have to define conString or connectionString');
    }

    this.connectionString = options.conString || options.connectionString || '';

    this.pool = new Pool({
      connectionString: this.connectionString
    });
  }

  /**
   * Core logging method exposed to Winston. Metadata is optional.
   * @param {string} level Level at which to log the message.
   * @param {string} msg Message to log
   * @param {Object=} meta Metadata to log
   * @param {Function} callback Continuation to respond to when complete.
   */
  log(level, msg, meta, callback) {
    const self = this;

    if (this.silent) {
      return callback(null, true);
    }

    return this.pool.connect((err, client, done) => {
      if (err) {
        self.emit('error', err);
        return callback(err);
      }

      return client.query({
        text: self.sqlStatement,
        values: ['now()', level, msg, circularJSON.stringify(meta)],
      }, (error) => {
        if (error) {
          self.emit('error', err);
          callback(err);
        } else {
          self.emit('logged');
          callback(null, true);
        }
        done();
      });
    });
  }

  /**
   * Query the transport. Options object is optional.
   * @param {Object} options - Loggly-like query options for this instance.
   * @param {string} [options.from] - Start time for the search.
   * @param {string} [options.until=now] - End time for the search. Defaults to "now".
   * @param {string} [options.rows=100] - Limited number of rows returned by search. Defaults to 100.
   * @param {string} [options.order=desc] - Direction of results returned, either "asc" or "desc".
   * @param {string} [options.fields]
   * @param {Function} callback - Continuation to respond to when complete.
   */
  query(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    const table = this.table;

    const fields = (options && options.fields instanceof Array) ?
      options.fields.map(field => table[field]) : [table.star()];

    let query = table.select(...fields)
      .from(table);

    if (options.from && options.until) {
      query = query.where(table.timestamp.between(moment(options.from).utc().toDate().toUTCString(),
        moment(options.until).utc().toDate().toUTCString()));
    }

    if (options.order && options.order === 'desc') {
      query = query.order(table.timestamp.descending);
    }

    if (options.rows) {
      query = query.limit(options.rows);
    }

    query = query.toQuery();

    const client = new Client({
      connectionString: this.connectionString
    });

    client.connect();
    return client.query(query, (err, result) => {
      const data = (result && result.rows instanceof Array) ? result.rows : [];
      client.end();
      return callback(null, data);
    });
  }

  /**
   * Returns a log stream for this transport. Options object is optional.
   * @param {Object} options Stream options for this instance.
   * @param {Stream} stream Pass in a pre-existing stream.
   * @return {Stream}
   */
  stream(options, stream) {
    options = options || {};
    stream = stream || new Stream();
    //
    const self = this;

    let start = options.start || null;
    let row = 0;

    if (start === -1) {
      start = null;
    }

    stream.destroy = () => {
      this.destroyed = true;
    };

    // we need to poll here.
    /* eslint wrap-iife: 0 */
    (function poll() {
      const query = self.table.select(self.table.star())
        .from(self.table).toQuery();

      return self.pool.connect((err, client, release) => {
        if (err) {
          return stream.emit('error', err.stack);
        }
        return client.query(query, (error, result) => {
          if (error) {
            if (stream.destroyed) {
              return release();
            }
            stream.emit('error', err);
            return setTimeout(poll, 2000);
          }
          if (stream.destroyed) {
            return release();
          }
          const rows = (result && result.rows instanceof Array) ? result.rows : [];
          rows.forEach((log) => {
            if (start === null || row > start) {
              stream.emit('log', log);
            }
            row += 1;
          });

          return setTimeout(poll, 2000);
        });
      });
    })();

    return stream;
  }
}

module.exports = Postgres;
