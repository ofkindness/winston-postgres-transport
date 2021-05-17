/**
 * @module 'logs'
 * @fileoverview log test suite for winston-postgres-test
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */
const assert = require('assert');

module.exports = (name, Transport, options) => {
  const transport = new Transport(options);

  const info = {
    level: 'debug',
    message: 'foo',
  };

  describe(`${name} .log()`, () => {
    afterAll(() => transport.end());
    beforeAll(() => transport.init());

    it('should be present', () => {
      assert.ok(transport.log);
      assert.strictEqual('function', typeof transport.log);
    });

    it('should return true whiout callback', () => {
      const result = transport.log(info);
      assert(true, result);
    });

    it('(with callback) should return true', () => {
      const result = transport.log(info, (_, ...status) => {
        assert(true, status);
      });
      assert(true, result);
    });

    it('should emit the "logged" event', (done) => {
      transport.once('logged', () => {
        done();
      });
      transport.log(info);
    });
  });
};
