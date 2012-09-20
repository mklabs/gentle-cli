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

<p>Main assertion thingy. First rough work.</p>

<p>Thx to @visionmedia, based off supertest's Runnable object:<br /><a href='https://github.com/visionmedia/supertest/blob/master/lib/Runnable.js'>https://github.com/visionmedia/supertest/blob/master/lib/Runnable.js</a></p>

<pre><code>
</code></pre>


<p>inherits from EventEmitter</p>

<pre><code>
util.inherits(Runnable, events.EventEmitter);</code></pre>


### Runnable.prototype.use()
<p>Setup CLI command.</p>

<pre><code>
Runnable.prototype.use = function use(command) {
  this._command = command;
  return this;
};</code></pre>


### Runnable.prototype.expect()
<p>Adds a new expctations to this runnable instance.</p>

<h2>Examples</h2>

<pre><code>.expect(0)
.expect(0, fn)
.expect(0, body)
.expect('Some body')
.expect('Some body', fn)
</code></pre>

<p>Returns the runnable.</p>

<pre><code>
Runnable.prototype.expect = function expect(a, b) {
  var self = this;

  if (typeof a === 'number') {
    this._status = a;
    if (b && typeof b !== 'function') this.addExpectation(b);
    else if(typeof b === 'function') this.end(b);
    return this;
  }

  this.addExpectation(a);

  if (typeof b === 'function') this.end(b);

  return this;
};</code></pre>


### Runnable.prototype.addExpectation()
<p>Adds a new expectation to the list of expected result. Can be either a<br />regexp or a string, in which case direct indexOf match</p>

<pre><code>
Runnable.prototype.addExpectation = function addExpectation(match) {
  this._expects.push(match);
};</code></pre>


### Runnable.prototype.prompt()
<p>Adds a new prompt hook to the list of expected prompts, automatically<br />writes the <code>answer</code> string provided to child's stdin when the<br /><code>matcher</code> RegExp or String match a given prompt in child stdout.</p>

<pre><code>
Runnable.prototype.prompt = function prompt(matcher, answer) {
  matcher = matcher instanceof RegExp ? matcher : new RegExp(matcher, 'i');
  this._prompts.push({
    matcher: matcher,
    answer: (answer || '') + '\n'
  });
  return this;
};</code></pre>


### Runnable.prototype.end()
<p>Defer invoking <code>.end()</code> until the command is done running.</p>

<h2>Examples</h2>

<pre><code>it('test thing', function(done) {
  cli()
    .use('thing')
    .expect(/run thing/)
    .end(done);
});
</code></pre>

<p>Returns the runnable instance.</p>

<pre><code>
Runnable.prototype.end = function end(fn) {
  var self = this;
  fn = fn || function() {};

  this.run(function(err, code, stdout, stderr) {
    self.emit('done');
    self.emit('end');

    self.assert({
      status: code,
      text: (stdout || stderr),
      err: err
    }, fn);
  });

  return this;
};</code></pre>

