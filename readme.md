gentle-cli
==========

**Inspired / Based off both [cli-easy](https://github.com/flatiron/cli-easy) and [supertest](https://github.com/visionmedia/supertest)**

> CLI assertions made easy.

- Struggling with testing cli tools.
- cli-easy is super great, but designed for generating vows
- supertest is super great, but designed to make HTTP assertions via super-agent.

gentle-cli is nothing more than a simple, chainable API to ease the process of
testing CLI applications & tools.

Right now, it doesn't do anything fancy and just allow you to easily test the
exit code and stdout output, and make assertions on top of that.

## Documentation

It should work with any test framework, here is an example using any
test framework at all.

```js
var cli = require('clt');

// promise
cli()
  .use('whoami')
  .expect(0, 'A fool')
  .then(function(res) {
    console.log(res.status);
    console.log(res.text);
    console.log(res.err);
  });

// callback
cli()
  .use('uname')
  .expect(0, 'Linux\n')
  .end(function(err, stdout, stderr) {
    if(err) throw err;
  });
```

#### ava

Check [gentle cli tests](./test), they're using ava:

```js
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
```

`cli().end()` returns a promise you can pass through ava, as well as `.then()` and `.catch()`.

#### mocha

Here's an example with mocha, note how you can pass done straight to any
of the `.expect()` calls (or `.end()`):

```js
describe('test uname', function() {
  it('respond with Linux', function(done) {
    cli()
      .use('uname')
      .expect('should return Linux', 'Linux\n')
      .expect(0, done)
  });
});
```

fancier example.

```js
describe('Testing on a wtf thing', function() {
  it('should fail as expected', function(done) {
    cli()
      .use('wtfBinary')
      .expect(127, /command not found/)
      .end(done);
  });
});
```

### API

#### module.exports = Runnable;

Main assertion thingy

Thx to @visionmedia, based off supertest's Runnable object:
https://github.com/visionmedia/supertest/blob/master/lib/Runnable.js


#### function Runnable(cmds, options)

Initialize a new `Runnable` with the given `options` Hash object.


#### Runnable#use()

Setup CLI command.


#### Runnable#expect()

Adds a new expectation to this runnable instance.

```js:
.expect(0)
.expect(0, fn)
.expect(0, body)
.expect('Some body')
.expect('Some body', fn)
```
#### Runnable#throws()

Adds a new expectation to this runnable instance.

```js:
.throws(0)
.throws('ENOENT')
.throws(require('constants').ENOENT)
```

#### Runnable#end()

Defer invoking `.end()` until the command is done running.

```js:
it('test thing', function(done) {
  cli()
    .use('thing')
    .expect(/run thing/)
    .end(done);
});
```

Returns a promise.

#### Runnable#then()

Automatically invokes `end()` and register the callback.

Returns a promise.


#### Runnable#catch()

Automatically invokes `end()` and register the errback.

Returns a promise.
