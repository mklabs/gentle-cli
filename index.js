
var Test = require('./test');

module.exports = cli;
cli.Test = Test;

function cli(o) {
  o = o || {};
  return new Test(o);
}
