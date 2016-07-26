var test = require('tape');
var Patch = require('../patch');
var microdom = require('micro-dom');

global.MutationObserver = require('micro-dom').MutationObserver;

function createDocument () {
  return new microdom.Document();
}

test('stream body tag', (t) => {
  var doc = createDocument();

  Patch(doc.documentElement, (message) => {
    t.ok(message.match(/<patch/));
    t.ok(message.match(/<html data-uuid="\S+"/));
    t.ok(message.match(/<a-cube data-uuid/));
    t.end();
  });

  doc.documentElement.innerHTML = '<body><a-scene><a-cube></a-cube></a-scene></body>';
});

test('add some elements', (t) => {
  var doc = createDocument();

  var matchers = [
    (message) => {
      t.ok(message.match(/<body/));
    },
    (message) => {
      t.ok(message.match(/<div/));
    },
    (message) => {
      t.ok(message.match(/<span/));
      t.end();
    }
  ];

  Patch(doc.documentElement, (message) => {
    matchers.shift()(message);
  });

  doc.documentElement.innerHTML = '<body><a-scene><a-cube></a-cube></a-scene></body>';

  var div;

  setTimeout(() => {
    div = doc.createElement('div');
    doc.body.appendChild(div);
  }, 5);

  setTimeout(() => {
    var span = doc.createElement('span');
    div.appendChild(span);
  }, 10);
});

test('remove an element', (t) => {
  var doc = createDocument();

  var matchers = [
    (message) => {
      t.ok(message.match(/<dead/));
      t.end();
    }
  ];

  doc.documentElement.innerHTML = '<body><a-scene><a-cube></a-cube></a-scene></body>';

  Patch(doc.documentElement, (message) => {
    matchers.shift()(message);
  });

  setTimeout(() => {
    var scene = doc.querySelector('a-scene');
    scene.removeChild(scene.firstChild);
  }, 5);
});

test('get full state', (t) => {
  var doc = createDocument();

  var p = new Patch(doc.documentElement, (message) => {});
  doc.documentElement.innerHTML = '<body><a-scene><a-cube></a-cube></a-scene></body>';

  t.ok(p.getFullState().match(/^<html/));

  t.end();
});

/*

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


*/