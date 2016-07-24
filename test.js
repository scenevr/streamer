var test = require('tape');
var streamer = require('../simulator/streamer');
var createDocument = require('../simulator/parser').createDocument;

test('stream body tag', (t) => {
  var doc = createDocument();

  streamer(doc.documentElement, (message) => {
    t.equal(message.mutations.length, 1);

    message.mutations.forEach((m) => {
      t.equal(m.addedNodes.length, 1);
      t.ok(m.addedNodes[0][1].match(/^<body/));
      t.end();
    });
  });

  doc.documentElement.innerHTML = '<body><a-scene><a-cube></a-cube></a-scene></body>';
});

test('add some markup', (t) => {
  var doc = createDocument();

  function markup (message) {
    return message.mutations[0].addedNodes[0][1];
  }

  var matchers = [
    (message) => {
      t.ok(markup(message).match(/<body/));
    },
    (message) => {
      t.ok(markup(message).match(/<div/));
    },
    (message) => {
      t.ok(markup(message).match(/<span/));
      t.end();
    }
  ];

  streamer(doc.documentElement, (message) => {
    matchers.shift()(message);
  });

  doc.documentElement.innerHTML = '<body><a-scene><a-cube></a-cube></a-scene></body>';

  var div;

  setTimeout(() => {
    div = doc.createElement('div');
    doc.body.appendChild(div);
  }, 50);

  setTimeout(() => {
    var span = doc.createElement('span');
    div.appendChild(span);
  }, 100);
});

test('animate a cube', (t) => {
  var doc = createDocument();
  var interval;

  doc.documentElement.innerHTML = '<body><a-scene><a-cube></a-cube></a-scene></body>';

  streamer(doc.documentElement, (message) => {
    t.equal(message.mutations.length, 1);
    t.equal(message.mutations[0].type, 'attribute');
    t.equal(message.mutations[0].name, 'rotation');

    clearInterval(interval);
    t.end();
  });

  var cube = doc.querySelector('a-cube');
  t.ok(cube);

  var e = {x: 0, y: 0, z: 0};

  interval = setInterval(() => {
    e.y += 1;
    cube.setAttribute('rotation', e);
  }, 5);
});

