/*
 * @module 'helpers'
 * @fileoverview Winston transport helpers
 * @license MIT
 * @author Andrei Tretyakov <andrei.tretyakov@gmail.com>
 */
const handleCallback = (callback, ...args) => {
  if (callback && typeof callback === 'function') {
    callback(...args);
  }
};

module.exports = { handleCallback };
