/**
 * @module 'query'
 * @fileoverview query test suite for winston-transport
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */
const assert = require('assert');

const info = {
  level: 'debug',
  message: 'message',
};

module.exports = (transport) => {
  describe('.query()', () => {
    it('should be present', () => {
      assert.ok(transport.query);
      assert.strictEqual('function', typeof transport.query);
    });

    it('should return matching results using default querying', () => {
      const callbackMock = jest.fn();
      transport.log(info, () => {
        transport.query({}, callbackMock);
        expect(callbackMock.mock.calls[0][0]).toBe(null);
        expect(callbackMock.mock.calls[0][1][0]).toHaveProperty('level');
        expect(callbackMock.mock.calls[0][1][0]).toHaveProperty('message');
        expect(callbackMock.mock.calls[0][1][0]).toHaveProperty('meta');
        expect(callbackMock.mock.calls[0][1][0]).toHaveProperty('timestamp');
      });
    });

    it('should return one result using the `rows` option', () => {
      const callbackMock = jest.fn();
      transport.log(info, () => {
        transport.query({ rows: 1 }, callbackMock);
        expect(callbackMock.mock.calls[0][0]).toBe(null);
        expect(callbackMock.mock.calls[0][1].length).toBe(1);
      });
    });

    it('should return matching results using `fields` and `order` option', () => {
      const callbackMock = jest.fn();
      transport.log(info, () => {
        transport.query(
          { fields: ['message', 'timestamp'], order: 'ASC' },
          callbackMock
        );
        expect(callbackMock.mock.calls[0][0]).toBe(null);
        expect(callbackMock.mock.calls[0][1].length).toBe(3);
        expect(callbackMock.mock.calls[0][1][0]).not.toHaveProperty('level');
        expect(callbackMock.mock.calls[0][1][0]).toHaveProperty('message');
        expect(callbackMock.mock.calls[0][1][0]).not.toHaveProperty('meta');
        expect(callbackMock.mock.calls[0][1][0]).toHaveProperty('timestamp');
      });
    });

    it('should return matching results using the `from` and `until` option', () => {
      const callbackMock = jest.fn();
      transport.log(info, () => {
        const from = Date.now() - 100 * 1000;
        const until = Date.now() + 100 * 1000;
        transport.query({ from, until }, callbackMock);
        expect(callbackMock.mock.calls[0][1].length).toBe(4);
      });
    });

    it('should return no results using a bad `from` and `until` option', () => {
      const callbackMock = jest.fn();
      transport.log(info, () => {
        const bad = Date.now() + 1000000;
        transport.query({ from: bad, until: bad }, callbackMock);
        expect(callbackMock.mock.calls[0][1].length).toBe(0);
      });
    });

    afterAll(() => transport.flush());
  });
};
