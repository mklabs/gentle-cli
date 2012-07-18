clt
===

**Inspired / Based off both
[cli-easy](https://github.com/flatiron/cli-easy) and
[supertest](https://github.com/visionmedia/supertest)**

> A fluent (i.e. chainable) syntax for generating vows tests for CLI applications.

> HTTP assertions made easy via super-agent.

Description
-----------

- Struggling with testing cli tools.
- cli-easy is super great, but designed for generating vows
- supertest is super great, but designed to make HTTP assertions via
  super-agent.

clt is nothing more than a simple, chainable API to ease the process of
testing CLI applications & tools.

Right now, it doesn't do anything fancy and just allow you to easily
test the exit code and stdout output, and make assertions on top of
that.

Example
-------

It should work with any test framework, here is an example using any
test framework at all.

```js
var cli = require('clt');

cli()
  .use('uname')
  .expect(0, 'Linux\n')
  .end(function(err, stdout, stderr) {
    if(err) throw err;
  });
```

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

API
---

> tbd

- expect(code, fn)
- expect(code, body, [fn])
- expect(body, [fn])
- end(fn)

