

var exec = require('child_process').exec,
    util = require('util'),
    events = require('events');


//
// Main assertion thingy. First rough work.
//
// Thx to @visionmedia, based off supertest's Test object:
// https://github.com/visionmedia/supertest/blob/master/lib/test.js
//


module.exports = Test;

// Initialize a new `Test` with the given `options` Hash object.

function Test(o) {
  this.options = o || {};
  this._body = '';
  this._status = 0;
  this._command = '';
}

// inherits from EventEmitter

util.inherits(Test, events.EventEmitter);

//
// Expectations:
//
//   .expect(0)
//   .expect(0, fn)
//   .expect(0, body)
//   .expect('Some body')
//   .expect('Some body', fn)
//

Test.prototype.expect = function(a, b){
  var self = this;

  // callback
  if (typeof b === 'function') this.end(b);

  // status
  if (typeof a === 'number') {
    this._status = a;
    // body
    if (b && typeof b !== 'function') this._body = b;
    return this;
  }

  // body
  this._body = a;

  return this;
};

//

Test.prototype.end = function(fn) {
  this.assert(res, fn);
  return this;
};

//
// Setup CLI location and default arguments.
//

Test.prototype.use = function (command) {
  this._command = command;
  return this;
};

//
// Defer invoking `.end()` until
// the command is done running.
//

Test.prototype.end = function(fn) {
  var self = this;

  this.run(function(err, stdout, stderr) {
    var code = err ? err.code : 0;

    self.emit('done');

    self.assert({
      status: code,
      text: (stdout || stderr),
      err: err
    }, fn);
  });

  return this;
};

//
// Add topic to current (or root) vow
//

Test.prototype.run = function (fn) {
  var cmd = this._command;

  if(!cmd) return this.emit(new Error('Cannot run withou a command. Use .use!'));

  this.emit('run');

  // Execute defined command with arguments and passed options
  exec(cmd, fn);

  return this;
};


// Perform assertions and invoke `fn(err)`.

Test.prototype.assert = function(res, fn) {
  var status = this._status,
    body = this._body,
    isregexp = body instanceof RegExp,
    expected,
    actual,
    re;

  // status
  if (status && res.status !== status) {
    return fn(new Error('expected ' + status + ', got ' + res.status), res);
  }

  // body
  if (body != null) {
    // string
    actual = util.inspect(res.text);
    expected = util.inspect(body);

    if (body !== res.text) {
      // regexp
      if (isregexp) {
        if (!body.test(res.text)) {
          return fn(new Error('expected body ' + res.text + ' to match ' + body));
        }
      } else {
        return fn(new Error('expected ' + expected + ' response body, got ' + actual));
      }
    }
  }

  fn(null, res);
};

