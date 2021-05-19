/**
 * @module 'stream'
 * @fileoverview stream test suite for winston-transport
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */
const assert = require('assert');

module.exports = (transport) => {
  describe('.stream()', () => {
    it('should be present', () => {
      assert.ok(transport.stream);
      assert.strictEqual('function', typeof transport.stream);
    });

    it('should stream logs using no options', () => {});
    it('should stream logs using the `start` option', () => {});
  });
};
