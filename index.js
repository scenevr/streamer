var MutationObserver = require('./parser').MutationObserver;

var privateAttributes = new WeakMap();

function setPrivateAttribute (element, name, value) {
  if (!privateAttributes[element]) {
    privateAttributes[element] = {};
  }

  privateAttributes[element][name] = value;
}

function getPrivateAttribute (element, name) {
  return privateAttributes[element] && privateAttributes[element][name];
}

function removePrivateAttribute (element, name) {
  if (privateAttributes[element]) {
    delete privateAttributes[element][name];
  }
}

module.exports = function observeAndDispatch (root, broadcast) {
  root.uuid = '#root';

  // function position (target) {
  //   var indexes = ['0'];
  //   var node = target;

  //   while (node.parentNode && node.parentNode !== root) {
  //     var sibling = node.previousSibling;
  //     var count = 0;

  //     while (sibling) {
  //       count++;
  //       sibling = sibling.previousSibling;
  //     }

  //     indexes.unshift(count.toString());

  //     node = node.parentNode;
  //   }

  //   return indexes.join('.');
  // }

  var observer = new MutationObserver(function (mutations) {
    var packets = [];

    mutations.forEach(function (mutation) {
      var packet = {
        target: mutation.target.uuid
      };

      // console.log(mutation.target.nodeName);
      // console.log(packet);

      switch (mutation.type) {
        case 'attributes':
          packet.type = 'attribute';
          packet.name = mutation.attributeName;
          packet.value = mutation.target.getAttribute(mutation.attributeName);
          break;

        case 'childList':
          packet.type = 'childList';
          packet.addedNodes = mutation.addedNodes.map((n) => [n.uuid, n.outerHTML]);
          packet.removedNodes = mutation.removedNodes.map((n) => n.uuid);
          break;

        default:
          console.error(`Unknown mutation type '${mutation.type}'.`);
          break;
      }

      packets.push(packet);
    });

    broadcast({
      type: 'mutation',
      mutations: packets
    });
  });

  // configuration of the observer:
  var config = { attributes: true, subtree: true, childList: true, characterData: true };

  observer.observe(root, config);
};
