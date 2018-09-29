/* eslint-disable no-underscore-dangle */
const { spawn, exec } = require('child_process');
const { EventEmitter } = require('events');
const util = require('util');
const debug = require('debug')('gentle-cli');
const constants = require('constants');

// Public: Main assertion thingy
//
// Thx to @visionmedia, based off supertest's Test object:
// https://github.com/visionmedia/supertest/blob/master/lib/Test.js
class Test extends EventEmitter {
  constructor(options) {
    super();

    this.options = options || {};
    this._body = null;
    this._status = 0;
    this._command = '';
    this._prompts = [];
    this._expects = [];
  }

  // Public: Setup CLI command.
  use(command) {
    this._command = command;
    return this;
  }

  // Public: Adds a new expectation to this runnable instance.
  //
  // Examples:
  //
  //    .expect(0)
  //    .expect(0, fn)
  //    .expect(0, body)
  //    .expect('Some body')
  //    .expect('Some body', fn)
  //
  // Returns the runnable.
  expect(a, b) {
    if (typeof a === 'number') {
      this._status = a;
      if (b && typeof b !== 'function') this.addExpectation(b);
      else if (typeof b === 'function') this.end(b);
      return this;
    }

    this.addExpectation(a);

    if (typeof b === 'function') this.end(b);

    return this;
  }

  // Public: Adds a new expectation to this runnable instance.
  //
  // Examples:
  //
  //    .throws(0)
  //    .throws('ENOENT')
  //    .throws(require('constants').ENOENT)
  //
  // Returns the runnable.
  throws(errcode) {
    const code = constants[errcode];
    if (!code) {
      throw new Error(`Invalid error code: ${errcode}`);
    }

    this.expect(code);
    return this;
  }

  // Private: Adds a new expectation to the list of expected result
  //
  // Can be either a regexp or a string, in which case direct indexOf match
  //
  // Examples:
  //
  //    .throws(0)
  //    .throws('ENOENT')
  //    .throws(require('constants').ENOENT)
  //
  // Returns the runnable.
  addExpectation(match) {
    this._expects.push(match);
  }

  // Adds a new prompt hook to the list of expected prompts, automatically
  // writes the `answer` string provided to child's stdin when the
  // `m` RegExp or String match a given prompt in child stdout.
  prompt(m, answer) {
    const matcher = m instanceof RegExp ? m : new RegExp(m, 'i');

    this._prompts.push({
      matcher,
      answer: `${answer || ''}\n`
    });

    return this;
  }

  // Public: Defer invoking `.end()` until the command is done running.
  //
  // Examples:
  //
  //    it('test thing', function(done) {
  //      cli()
  //        .use('thing')
  //        .expect(/run thing/)
  //        .end(done);
  //    });
  //
  // Returns a Promise.
  end(done) {
    const promise = new Promise((resolve, reject) => {
      this.run((err, code, stdout, stderr) => {
        this.emit('done');
        this.emit('end');

        const res = {
          status: code,
          text: stdout || stderr,
          err
        };

        this.assert(res, (error, result) => {
          if (error) {
            reject(error);
            return done && done(error);
          }

          resolve(result);
          return done && done(null, result);
        });
      });
    });

    promise.catch(err => {
      debug('Error: %s', err.stack || err.message);
    });

    return promise;
  }

  // Public: Automatically invokes `end()` and register the callback.
  then(fn) {
    return this.end().then(fn);
  }

  // Public: Automatically invokes `end()` and register the errback.
  catch(fn) {
    return this.end().catch(fn);
  }

  // Private: Execute defined command with arguments and passed options
  //
  // Case of redirect options turned on, pipe back all stdout / stderr output to
  // parent process
  run(fn) {
    const cmd = this._command;
    const opts = this.options;

    if (this._run) return fn(null, this.code, this.stdout, this.stderr);

    if (!cmd) {
      const err = new Error('Cannot run without a command. Use .use!');
      this.emit(err);
      throw err;
    }

    debug('exec cmd: %s', cmd);
    const child = exec(cmd, opts);
    const write = child.stdin.write.bind(child.stdin);

    // mark this runnable as consumed
    this._run = true;

    if (opts.redirect) {
      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stderr);
    }

    this.stdout = '';
    // child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      this.stdout += chunk;
      this.emit('data', chunk);
      this._prompts.forEach(prompt => {
        if (prompt.matcher.test(chunk)) {
          process.nextTick(write.bind(null, prompt.answer));
        }
      });
    });

    this.stderr = '';
    child.stderr.on('data', chunk => {
      this.stderr += chunk;
    });

    let errcode = 0;
    child.on('error', err => {
      debug('Spawn error:', err);
      errcode = err.code;
    });

    child.on('close', spawnCode => {
      const hasCode = errcode && constants[errcode];
      const code = hasCode ? constants[errcode] : spawnCode;
      this.code = code;
      if (!code) return fn(null, code, this.stdout, this.stderr);
      const msg = `Error executing "${this._command}". Code:${code}`;
      const err = new Error(`${msg}\n\n${this.stderr || this.stdout}`);
      err.code = code;
      return fn(err, code, this.stdout, this.stderr);
    });

    return this;
  }

  // Private: Perform assertions and invoke `fn(err)`.
  assert(res, fn) {
    const status = this._status;
    const expects = this._expects;
    let err;

    if (status && res.status !== status) {
      err = new Error(`expected ${status}, got ${res.status}`);
      err.code = status || 1;
      return fn(err, res);
    }

    const errors = [];
    expects.forEach(expect => {
      const isregexp = expect instanceof RegExp;
      const expected = util.inspect(expect);

      // regexp
      if (isregexp && !expect.test(res.text)) {
        errors.push(expected);
      }
    });

    if (!errors.length) return fn(null, res);

    let msg = `Expected ${util.inspect(res.text)}\n to match:\n`;
    msg += errors.map(expected => ` - ${expected}`).join('\n');
    err = new Error(msg);
    err.code = status || 1;

    return fn(err, res);
  }
}

module.exports = Test;
