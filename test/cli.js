import test from 'ava';
import cli from '..';
import constants from 'constants';

test('Testing on uname', t => {
  return cli()
    .use('uname')
    .expect(0, process.platform === 'darwin' ? 'Darwin' : 'Linux')
    .end();
});

test('Testing on a wtf thing', t => {
  return cli()
    .use('wtfBinary')
    .expect(constants.ENOENT)
    .throws('ENOENT')
    .end();
});
