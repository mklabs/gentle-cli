var spawn = require('child_process').spawn,
  events = require('events'),
  util = require('util');

//
// Main assertion thingy. First rough work.
//
// Thx to @visionmedia, based off supertest's Runnable object:
// https://github.com/visionmedia/supertest/blob/master/lib/Runnable.js
//
module.exports = Runnable;

// Initialize a new `Runnable` with the given `options` Hash object.

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

// Setup CLI command.
Runnable.prototype.use = function use(command) {
  this._command = command;
  return this;
};


// Adds a new expctations to this runnable instance.
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

// Adds a new expectation to the list of expected result. Can be either a
// regexp or a string, in which case direct indexOf match
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

// Defer invoking `.end()` until the command is done running.
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
// Returns the runnable instance.
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
};

// Add topic to current (or root). Execute defined command with arguments and
// passed options,  case of redirect options turned on, pipe back all stdout /
// stderr output to parent process
//
// @api private
Runnable.prototype.run = function run(fn) {
  var self = this,
    cmds = this._command,
    opts = this.options;

  if(this._run) return fn(null, self.code, self.stdout, self.stderr);
  if(!cmds) return this.emit(new Error('Cannot run without a command. Use .use!'));

  cmds = cmds.split(' ');

  var child = spawn(cmds.shift(), cmds, opts),
    write = child.stdin.write.bind(child.stdin);

  // mark this runnable as consumed
  this._run = true;

  if(opts.redirect) {
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  }

  self.stdout = '';
  child.stdout.setEncoding('utf8');
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

  child.on('exit', function(code) {
    self.code = code;
    if(!code) return fn(null, code, self.stdout, self.stderr);
    var msg = 'Error executing "' + self._command + '". Code:' + code;
    var err = new Error(msg + '\n\n' + (self.stderr || self.stdout));
    err.code = code;
    fn(err, code, self.stdout, self.stderr);
 });

  return this;
};


// Perform assertions and invoke `fn(err)`.
//
// @api private
Runnable.prototype.assert = function assert(res, fn) {
  var status = this._status,
    expects = this._expects;

  if (status && res.status !== status) {
    return fn(new Error('expected ' + status + ', got ' + res.status), res);
  }

  var errors = [];
  expects.forEach(function(expect) {
    var isregexp = expect instanceof RegExp,
      expected = util.inspect(expect);

    // regexp
    if (isregexp) {
      if (!expect.test(res.text)) {
        return errors.push(expected);
      }
    } else if(!~res.text.indexOf(expect)) {
      console.log('what', res.text, expected);
      return errors.push(expected);
    }
  });

  if(!errors.length) return fn(null, res);

  var msg = 'Expected ' + util.inspect(res.text) + '\n to match:\n';
  msg += errors.map(function(expected) {
    return ' - ' + expected;
  }).join('\n');

  fn(new Error(msg), res);
};

