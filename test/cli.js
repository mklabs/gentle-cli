
var cli = require('..');

describe('Testing on uname', function() {
  it('should return Linux ', function(done) {
    cli()
      .use('uname')
      .expect(0, process.platform === 'darwin' ? 'Darwin' : 'Linux')
      .end(done);
  });
});

describe('Testing on a wtf thing', function() {
  it('should fail as expected', function(done) {
    cli()
      .use('wtfBinary')
      .expect(127)
      .end(done);
  });
});

