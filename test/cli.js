
var cli = require('..');

describe('Testing on uname', function() {
  it('should return Linux ', function(done) {
    cli()
      .use('uname')
      .expect(0, 'Linux\n')
      .end(done);
  });
});

describe('Testing on a wtf thing', function() {
  it('should fail as expected', function(done) {
    cli()
      .use('wtfBinary')
      .expect(127, /command not found/)
      .end(done);
  });
});

