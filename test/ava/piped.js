import test from 'ava';
import cli from '../..';

test('Testing with pipe', t => {
  t.plan(0);
  return cli()
    .use('echo foo | cat')
    .end((err, stdout, stderr) => {
      console.log('OUT', stdout);
      console.log('ERR', stderr);
      if (err) throw err;
    });
});
