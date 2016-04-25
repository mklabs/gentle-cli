
var stdin = process.stdin;

stdin.setEncoding('utf8');

var json = ''
stdin.on('readable', () => {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    json += chunk;
  }
});

stdin.on('end', () => {
  var data = JSON.parse(json);

  var file = data.find((f) => {
    return f.file === 'test';
  });

  file.tomdocs.forEach((doc) => {
    console.log(`#### ${doc.identifier}

${doc.description}

${doc.examples ? '```js' + doc.examples + '```' : ''}`);
  });

  // console.log(file);
});
