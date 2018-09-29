const Test = require('./lib/test');

const cli = (options = {}) => new Test(options);

module.exports = cli;
cli.Test = Test;
