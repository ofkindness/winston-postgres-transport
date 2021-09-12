/**
 * @module 'winston-postgres-transport'
 * @fileoverview Winston transport for logging into PostgreSQL
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */

import postgres from 'postgres';
import moment from 'moment';
import Transport from 'winston-transport';
import { callbackify } from 'util';

import { handleCallback } from './helpers';

export interface PostgresTransportOptions {
  postgresUrl: string;
  postgresOptions: any;
  defaultMeta?: any;
  label?: string;
  level?: string;
  name?: string;
  silent?: boolean;
  tableName?: string;
}

export interface PostgresTransport extends PostgresTransportOptions {
  tableFields: string[];
  sql: any;
  defaultMeta: any;
  label: string;
  level: string;
  name: string;
  silent: boolean;
  tableName: string;
}

export interface QueryOptions {
  fields?: string[];
  from?: Date | string;
  order?: string;
  rows?: number;
  until?: Date | string;
}

export enum Table {
  level = 'level',
  message = 'message',
  meta = 'meta',
  timestamp = 'timestamp',
}

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
export class PostgresTransport extends Transport {
  constructor(options: PostgresTransportOptions) {
    super();

    const {
      defaultMeta,
      label = '',
      level = 'info',
      name = 'PostgresTransport',
      postgresOptions = {},
      postgresUrl,
      silent = false,
      tableName = 'winston_logs',
    } = options;

    //
    // Configure postgres
    //
    if (!postgresUrl) {
      throw new Error('You have to define url connection string');
    }

    this.defaultMeta = defaultMeta;
    this.label = label;
    this.level = level;
    this.name = name;
    this.silent = silent;
    this.sql = postgres(postgresUrl, postgresOptions);
    this.tableFields = Object.values(Table);
    this.tableName = tableName;
  }

  /**
   * Create logs table method.
   * @return {Promise} result of creation within a Promise
   */
  init(): Promise<any> {
    return this.sql`CREATE TABLE IF NOT EXISTS ${this.sql(this.tableName)} (
        ${this.sql(this.tableFields[0])} character varying,
        ${this.sql(this.tableFields[1])} character varying,
        ${this.sql(this.tableFields[2])} json,
        ${this.sql(
          this.tableFields[3],
        )} timestamp without time zone DEFAULT NOW()
    );`;
  }

  /**
   * End the connection
   * Return a Promise which resolves when all queries are finished and the underlying connections are closed.
   * @return {Promise} result within a Promise
   */
  close(timeout = 0): Promise<any> {
    return this.sql.end({ timeout });
  }

  /**
   * Flush all logs
   * Return a Promise which resolves when all logs are finished.
   * @return {Promise} result within a Promise
   */
  flush(): Promise<any> {
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
  log(info: any, callback: Function) {
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

      const logQuery = async (cb: (e: unknown) => void) => {
        try {
          await sql`INSERT INTO ${sql(tableName)} ${sql(log, ...tableFields)}`;
        } catch (error) {
          cb(error);
        }
      };

      logQuery((error: unknown) => {
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
  query(options: QueryOptions, callback: Function) {
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

    const queryQuery = callbackify<any>(
      () => sql`SELECT ${sql(filteredFields)}
    FROM ${sql(tableName)}
    WHERE ${sql(tableFields[3])} >= ${moment(from)
        .utc()
        .format('YYYY-MM-DD HH:mm:ss.SSS')} 
    AND ${sql(tableFields[3])} < ${moment(until)
        .utc()
        .format('YYYY-MM-DD HH:mm:ss.SSS')}
    ORDER BY ${sql(tableFields[3])} ${sql(order)}
    LIMIT ${sql(rows)};`,
    );

    queryQuery((error: unknown, data: any) => {
      if (error) {
        return handleCallback(callback, error);
      }
      return handleCallback(callback, null, data);
    });
  }
}
