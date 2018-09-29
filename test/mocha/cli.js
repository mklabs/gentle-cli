const constants = require('constants');
const assert = require('assert');
const debug = require('debug')('gentle-cli:test');
const cli = require('../..');

describe('gentle-cli', () => {
  it('Simple mocha promise test', () => {
    debug('Testing on uname');

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        debug('hey');
        resolve();
      }, 1000);
    });
  });

  it('Testing on uname', () => cli()
      .use('uname')
      .expect(0, process.platform === 'darwin' ? 'Darwin' : 'Linux')
      .end());
});
