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

  it('Testing on uname', () =>
    cli()
      .use('uname')
      .expect(0, process.platform === 'darwin' ? 'Darwin' : 'Linux')
      .end());

  it('Testing promise style', () =>
    cli()
      .use('ls lib')
      .expect(0)
      .then(res => {
        assert.equal(res.status, 0);
        assert.equal(res.text, 'test.js\n', 'Expected return text');
      }));

  it('Testing promise async style', async () => {
    const res = await cli()
      .use('ls lib')
      .expect(0)
      .end();

    console.log('res', res);
    assert.equal(res.status, 0);
    assert.equal(res.text, 'test.js\n', 'Expected return text');
  });
});
