import test from 'ava';
import cli from '../..';

test('Testing with node -e', t => {
  t.plan(0);

  return cli()
    .use(`node -e "console.log('foo')"`)
    .expect(0, 'foo')
    .end();
});

test('Testing with node -pe', t => {
  t.plan(0);

  return cli()
    .use(`node -pe "foo"`)
    .expect(0, 'foo')
    .end();
});

test('Testing with node -e and spaces', t => {
  t.plan(0);

  return cli()
    .use(`node -e " console.log('foo') "`)
    .expect(0, 'foo')
    .end();
});

test('Testing with node -e and spaces and quotes', t => {
  t.plan(0);

  return cli()
    .use('node -e " console.log(2) "')
    .expect(0, '2')
    .end((err, { text }) => console.log(text));
});
