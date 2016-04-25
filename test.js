var spawn     = require('child_process').spawn;
var events    = require('events');
var util      = require('util');
var debug     = require('debug')('gentle-cli');
var constants = require('constants');


// Public: Main assertion thingy
//
// Thx to @visionmedia, based off supertest's Runnable object:
// https://github.com/visionmedia/supertest/blob/master/lib/Runnable.js
module.exports = Runnable;

// Public: Initialize a new `Runnable` with the given `options` Hash object.
function Runnable(cmds, options) {
  this.options = options || {};
  this._body = null;
  this._status = 0;
  this._command = '';
  this._prompts = [];
  this._expects = [];
  this.use(cmds);
}

// inherits from EventEmitter
util.inherits(Runnable, events.EventEmitter);

// Public: Setup CLI command.
Runnable.prototype.use = function use(command) {
  this._command = command;
  return this;
};


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
};

// Public: Adds a new expectation to this runnable instance.
//
// Examples:
//
//    .throws(0)
//    .throws('ENOENT')
//    .throws(require('constants').ENOENT)
//
// Returns the runnable.
Runnable.prototype.throws = function throws(errcode) {
  var code = constants[errcode];
  if (!code) {
    throw new Error('Invalid error code: ' +  errcode);
  }

  this.expect(code);
  return this;
};

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
Runnable.prototype.addExpectation = function addExpectation(match) {
  this._expects.push(match);
};

// Adds a new prompt hook to the list of expected prompts, automatically
// writes the `answer` string provided to child's stdin when the
// `matcher` RegExp or String match a given prompt in child stdout.
Runnable.prototype.prompt = function prompt(matcher, answer) {
  matcher = matcher instanceof RegExp ? matcher : new RegExp(matcher, 'i');
  this._prompts.push({
    matcher: matcher,
    answer: (answer || '') + '\n'
  });
  return this;
};

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
Runnable.prototype.end = function end(done) {
  var promise = new Promise(function(r, errback) {
    this.run(function(err, code, stdout, stderr) {
      this.emit('done');
      this.emit('end');

      var res = {
        status: code,
        text: (stdout || stderr),
        err: err
      };

      this.assert(res, function(err, res) {
        if (err) {
         errback(err);
         return done && done(err);
        }

        r(res);
        return done && done(null, res);
      });
    }.bind(this));
  }.bind(this));

  promise.catch(done || function(err) {
    debug('Error: %s', err.stack || err.message);
  });

  return promise;
};

// Public: Automatically invokes `end()` and register the callback.
Runnable.prototype.then = function then(fn) {
  return this.end().then(fn);
};

// Public: Automatically invokes `end()` and register the errback.
Runnable.prototype.catch = function then(fn) {
  return this.end().catch(fn);
};

// Private: Execute defined command with arguments and passed options
//
// Case of redirect options turned on, pipe back all stdout / stderr output to
// parent process
Runnable.prototype.run = function run(fn) {
  var self = this;
  var cmds = this._command;
  var opts = this.options;

  if(this._run) return fn(null, self.code, self.stdout, self.stderr);
  if(!cmds) return this.emit(new Error('Cannot run without a command. Use .use!'));

  cmds = cmds.split(' ');

  var cmd = cmds.shift();
  debug('Spawn cmd: %s', cmd, cmds);
  var child = spawn(cmd, cmds, opts);
  var write = child.stdin.write.bind(child.stdin);

  // mark this runnable as consumed
  this._run = true;

  if(opts.redirect) {
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  }

  self.stdout = '';
  // child.stdout.setEncoding('utf8');
  child.stdout.on('data', function(chunk) {
    self.stdout += chunk;
    self.emit('data', chunk);
    self._prompts.forEach(function(prompt) {
      if(prompt.matcher.test(chunk)) {
        process.nextTick(write.bind(null, prompt.answer));
      }
    });
  });

  self.stderr = '';
  child.stderr.on('data', function(chunk) {
    self.stderr += chunk;
  });

  var errcode = 0;
  child.on('error', function(err) {
    debug('Spawn error:', err);
    errcode = err.code;
  });

  child.on('close', function(code) {
    code = errcode && constants[errcode] ? constants[errcode] : code;
    self.code = code;
    if(!code) return fn(null, code, self.stdout, self.stderr);
    var msg = 'Error executing "' + self._command + '". Code:' + code;
    var err = new Error(msg + '\n\n' + (self.stderr || self.stdout));
    err.code = code;
    fn(err, code, self.stdout, self.stderr);
 });

  return this;
};


// Private: Perform assertions and invoke `fn(err)`.
Runnable.prototype.assert = function assert(res, fn) {
  var status = this._status;
  var expects = this._expects;
  var err;

  if (status && res.status !== status) {
    err = new Error('expected ' + status + ', got ' + res.status);
    err.code = status || 1;
    return fn(err, res);
  }

  var errors = [];
  expects.forEach(function(expect) {
    var isregexp = expect instanceof RegExp;
    var expected = util.inspect(expect);

    // regexp
    if (isregexp) {
      if (!expect.test(res.text)) {
        return errors.push(expected);
      }
    } else if(!~res.text.indexOf(expect)) {
      return errors.push(expected);
    }
  });

  if(!errors.length) return fn(null, res);
  err = new Error(msg);
  err.code = status || 1;

  var msg = 'Expected ' + util.inspect(res.text) + '\n to match:\n';
  msg += errors.map(function(expected) {
    return ' - ' + expected;
  }).join('\n');

  fn(err, res);
};
