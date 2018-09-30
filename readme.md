# gentle-cli [![Build Status](https://travis-ci.org/mklabs/gentle-cli.svg?branch=master)](https://travis-ci.org/mklabs/gentle-cli)

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
var cli = require('gentle-cli');

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
```

`cli().end()` returns a promise you can pass through ava, as well as `.then()` and `.catch()`.

**Tips** Make sure to call `t.plan(0)` if you're doing assertions using `gentle-cli` and not ava. Otherwise, `ava` will fail.

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

promise example



### API

#### module.exports = Runnable;

Main assertion thingy

Thx to @tj, based off supertest's Runnable object:
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

# Changelog

## [Unreleased](https://github.com/mklabs/gentle-cli/compare/v1.0.4...HEAD)

## [v1.0.4](https://github.com/mklabs/gentle-cli/compare/v1.0.3...v1.0.4) - 2018-09-30

### Fixed

- Switch to exec instead of spawn [`#1`](https://github.com/mklabs/gentle-cli/issues/1) [`#2`](https://github.com/mklabs/gentle-cli/issues/2)

### Commits

- es6: update test.js to use most of es6 syntax (thx prettier) [`cff47b0`](https://github.com/mklabs/gentle-cli/commit/cff47b0dc57ce7f2a104d4cc483b36a5506fd21c)
- Rewrite test.js using es6 class syntax [`055059d`](https://github.com/mklabs/gentle-cli/commit/055059dae663de203d255c8762d8b46bad004519)
- Update test, setup travis [`ee72e69`](https://github.com/mklabs/gentle-cli/commit/ee72e691f5852f34c45ce08bf0c08c00e0a935ae)

## [v1.0.3](https://github.com/mklabs/gentle-cli/compare/v1.0.2...v1.0.3) - 2016-04-26

### Commits

- Fix asserts err return [`115f129`](https://github.com/mklabs/gentle-cli/commit/115f12983838c4664076d79a1dda03a18c2c2f40)

## [v1.0.2](https://github.com/mklabs/gentle-cli/compare/v1.0.1...v1.0.2) - 2016-04-25

### Commits

- s/clt/gentle-cli [`5a71dae`](https://github.com/mklabs/gentle-cli/commit/5a71daeed10fe85c11e05b85b908dfe50349e8a5)

## [v1.0.1](https://github.com/mklabs/gentle-cli/compare/v1.0.0...v1.0.1) - 2016-04-25

### Commits

- MIT [`1811d15`](https://github.com/mklabs/gentle-cli/commit/1811d158ff95bf98d7ccfa5dadf6b74f6e606e8e)
- s/visionmedia/tj [`ce1bd1e`](https://github.com/mklabs/gentle-cli/commit/ce1bd1e0c438ddf7e8f8ebfbb259be907581f944)

## [v1.0.0](https://github.com/mklabs/gentle-cli/compare/v0.0.2...v1.0.0) - 2016-04-25

### Commits

- Update code, implement throws and better support of node core errors [`6c22c97`](https://github.com/mklabs/gentle-cli/commit/6c22c97791299afc87b9e6f3ae13a5c58235fc5c)
- Document api [`d7dd12f`](https://github.com/mklabs/gentle-cli/commit/d7dd12f6de46a1caec13568bd14aae8730bd4f73)

## [v0.0.2](https://github.com/mklabs/gentle-cli/compare/v0.0.1...v0.0.2) - 2012-09-20

### Commits

- updates, adding prompt api, multiple expecs, adding API docs [`cecca5f`](https://github.com/mklabs/gentle-cli/commit/cecca5fe9211a0a755d95b5a05324537161e1a9a)

## v0.0.1 - 2012-07-18

### Commits

- haha.. this :q thing was funny [`4dac4f7`](https://github.com/mklabs/gentle-cli/commit/4dac4f7b14b2964e986f443f6c8d06e3b6b7ac43)
- 1st [`1bd8290`](https://github.com/mklabs/gentle-cli/commit/1bd8290f184dbce963e12b79ee319baa08b7e43c)
