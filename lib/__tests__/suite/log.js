/**
 * @module 'logs'
 * @fileoverview log test suite for winston-transport
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */
const assert = require('assert');

const info = {
  level: 'debug',
  message: 'message',
};

module.exports = (transport) => {
  describe(`.log()`, () => {
    it('should be present', () => {
      assert.ok(transport.log);
      assert.strictEqual('function', typeof transport.log);
    });

    it('should return true without callback', () => {
      const result = transport.log(info);
      assert(true, result);
    });

    it('should return true with callback', () => {
      const result = transport.log(info, (_, ...status) => {
        assert(true, status);
      });
      assert(true, result);
    });

    it('should emit the `logged` event', (done) => {
      transport.once('logged', () => {
        done();
      });
      transport.log(info);
    });

    afterAll(() => transport.flush());
  });
};
