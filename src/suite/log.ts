/**
 * @module 'logs'
 * @fileoverview log test suite for winston-transport
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */
import assert, { ok, strictEqual } from 'assert';

const info = {
  level: 'debug',
  message: 'message',
};

export default (transport: any) => {
  describe(`.log()`, () => {
    it('should be present', () => {
      ok(transport.log);
      strictEqual('function', typeof transport.log);
    });

    it('should return true without callback', () => {
      const result = transport.log(info);
      assert(true, result);
    });

    it('should return true with callback', () => {
      const result = transport.log(info, (_: any, ...status: any) => {
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
