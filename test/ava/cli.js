import test from 'ava';
import constants from 'constants';
import cli from '../..';

test('Testing on uname', t => {
  t.plan(0);

  return cli()
    .use('uname')
    .expect(0, process.platform === 'darwin' ? 'Darwin' : 'Linux')
    .end();
});

test('Testing on a wtf thing', t => {
  t.plan(0);

  return cli()
    .use('wtfBinary')
    .expect(constants.ENOENT)
    .throws('ENOENT')
    .end();
});

test('Testing promise style', t => {
  t.plan(2);

  return cli()
    .use('ls scripts')
    .expect(0)
    .then(res => {
      t.is(res.status, 0);
      t.is(res.text, 'docs.js\n');
    });
});

test('Testing promise style catch', t => {
  t.plan(1);

  return cli()
    .use('ls')
    .expect(2)
    .catch(err => {
      t.is(err.code, 2);
    });
});

test('Testing promise style async', async t => {
  const result = await cli()
    .use('echo foo')
    .expect(0)
    .end();

  t.is(result.status, 0);
  t.is(result.text, 'foo\n');
});
