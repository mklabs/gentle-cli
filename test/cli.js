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

test('Testing promise style', t => {
  t.plan(2);
  return cli()
    .use('ls')
    .expect(0)
    .then((res) => {
      t.is(res.status, 0);
      t.is(res.text, 'cli.js\n');
    });
});

test('Testing promise style catch', t => {
  t.plan(1);
  return cli()
    .use('ls')
    .expect(2)
    .catch((err) => {
      t.is(err.code, 2);
    });
});
