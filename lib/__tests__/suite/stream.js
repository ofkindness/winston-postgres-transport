/**
 * @module 'stream'
 * @fileoverview stream test suite for winston-transport
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */
const assert = require('assert');

const info = {
  level: 'debug',
  message: 'message',
};

module.exports = (transport) => {
  describe('.stream()', () => {
    it('should be present', () => {
      assert.ok(transport.stream);
      assert.strictEqual('function', typeof transport.stream);
    });

    it('should stream logs using no options', async () => {
      const callbackMock = jest.fn();

      const stream = await transport.stream({});
      await transport.log(info);
      stream.on('log', callbackMock);
    });
    it('should stream logs using the `start` option', () => {});

    afterAll(() => transport.flush());
  });
};
