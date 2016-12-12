var test = require('tape');
var Patch = require('../patch');
var Apply = require('../apply');
var microdom = require('micro-dom');

const GLOBALS = {
  HTMLElement: microdom.HTMLElement,
  MutationObserver: require('micro-dom').MutationObserver
};

function createDocument (html) {
  var doc = new microdom.Document();

  if (html) {
    doc.documentElement.innerHTML = html;
  }

  return doc;
}

function parseMessage (html) {
  var doc = new microdom.Document();
  doc.body.innerHTML = html;
  return doc.body.firstChild;
}

test('stream body tag', (t) => {
  var doc = createDocument();

  Patch(GLOBALS, doc.documentElement, (message) => {
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

  Patch(GLOBALS, doc.documentElement, (message) => {
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

  Patch(GLOBALS, doc.documentElement, (message) => {
    matchers.shift()(message);
  });

  setTimeout(() => {
    var scene = doc.querySelector('a-scene');
    scene.removeChild(scene.firstChild);
  }, 5);
});

test('add some text', (t) => {
  var doc = createDocument('<body><a-scene><a-cube></a-cube></a-scene></body>');

  Patch(GLOBALS, doc.documentElement, (message) => {
    t.ok(message.match(/i am a potato/));
    t.end();
  });

  var scene = doc.querySelector('a-cube');
  scene.innerHTML = 'hi mum i am a potato';
});

test('get full state', (t) => {
  var doc = createDocument();

  var p = new Patch(GLOBALS, doc.documentElement, (message) => {});
  doc.documentElement.innerHTML = '<body><a-scene><a-cube></a-cube></a-scene></body>';

  t.ok(p.getSnapshot().match(/<html/));
  t.end();
});

test('filter script tags', (t) => {
  var doc = createDocument();

  var p = new Patch(GLOBALS, doc.documentElement, (message) => {}, (el) => {
    if (el.nodeName === 'SCRIPT') {
      return false;
    }

    if (el.nodeName === 'LINK') {
      return false;
    }

    return true;
  });

  doc.documentElement.innerHTML = '<body><a-scene></a-scene><script>hello()</script><link rel="http://blah/blah" /></body>';

  var s = p.getSnapshot();
  t.ok(s.match(/<a-scene/));
  t.ok(!s.match(/<script/));
  t.ok(!s.match(/<link/));

  t.end();
});

test('animate a cube', (t) => {
  var doc = createDocument();
  var interval;

  doc.documentElement.innerHTML = '<body><a-scene><a-cube></a-cube></a-scene></body>';

  Patch(GLOBALS, doc.documentElement, (message) => {
    // console.log(message);
    // t.equal(message.mutations.length, 1);
    // t.equal(message.mutations[0].type, 'attribute');
    // t.equal(message.mutations[0].name, 'rotation');
    // t.end();
  });

  var cube = doc.querySelector('a-cube');
  t.ok(cube);

  var e = {x: 0, y: 0, z: 0};
  var p = {x: 0, y: 0, z: 0};

  interval = setInterval(() => {
    e.y += 1;
    p.y = Math.sin(e.y) * 4;
    cube.setAttribute('rotation', [e.x, e.y, e.z].join(' '));
    cube.setAttribute('position', [p.x, p.y, p.z].join(' '));
  }, 5);

  setTimeout(() => {
    clearInterval(interval);
    t.end();
  }, 25);
});

/* Apply */

test('add some text', (t) => {
  t.plan(4);

  var doc = createDocument('<body><a-scene><a-cube></a-cube></a-scene></body>');
  var slave = createDocument();
  var apply = new Apply(slave.documentElement);

  var patch = new Patch(GLOBALS, doc.documentElement, (message) => {
    var patch = parseMessage(message);
    t.equal('PATCH', patch.nodeName);
    t.ok(apply.onMessage(patch));
  });

  apply.onMessage(parseMessage(patch.getSnapshot()));

  var cube = doc.querySelector('a-cube');
  cube.setAttribute('position', '1 2 3');

  setTimeout(() => {
    var cube = slave.querySelector('a-cube');
    t.ok(cube);
    t.equal('1 2 3', cube.getAttribute('position'));
  }, 10);
});

test('add two elements', (t) => {
  t.plan(8);

  var doc = createDocument('<body><a-scene><a-entity id="avatars"></a-entity></a-scene></body>');
  var slave = createDocument();
  var apply = new Apply(slave.documentElement);

  var patch = new Patch(GLOBALS, doc.documentElement, (message) => {
    var patch = parseMessage(message);
    t.equal('PATCH', patch.nodeName);
    t.ok(apply.onMessage(patch), 'apply patch');
  });

  apply.onMessage(parseMessage(patch.getSnapshot()));

  const avatars = doc.querySelector('#avatars');

  const a = doc.createElement('a-avatar');
  avatars.appendChild(a);

  setTimeout(() => {
    const b = doc.createElement('a-avatar');
    avatars.appendChild(b);
  }, 10);

  setTimeout(() => {
    var avatars = slave.querySelector('#avatars');
    t.ok(avatars);
    t.equal(2, avatars.childNodes.length);
    t.equal('A-AVATAR', avatars.firstChild.nodeName);
    t.equal('A-AVATAR', avatars.lastChild.nodeName);
  }, 20);
});

