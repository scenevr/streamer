/* globals MutationObserver */

var pa = require('./private-attributes');
var uuid = require('uuid');

const UUID_KEY = 'data-uuid';

function Patch (root, broadcast) {
  var document = root.ownerDocument;

  // todo - add uuid to textNodes
  function treeUUID (el, childNodes) {
    var nodes = [el];

    if (childNodes) {
      nodes = nodes.concat(el.querySelectorAll('*'));
    }

    nodes.forEach((e) => {
      if (!pa.has(e, UUID_KEY)) {
        pa.set(e, UUID_KEY, uuid.v4());
      }
    });
  }

  function cloneWithUUID (el) {
    var result = el.cloneNode(false);

    result.setAttribute(UUID_KEY, pa.get(el, UUID_KEY));

    el.childNodes.forEach((n) => {
      if (n.nodeType === 1) {
        result.appendChild(cloneWithUUID(n));
      } else {
        result.appendChild(n.cloneNode(true));
      }
    });

    return result;
  }

  this.getFullState = function () {
    return cloneWithUUID(root).outerHTML;
  };

  var observer = new MutationObserver(function (mutations) {
    var patch = document.createElement('patch');

    mutations.forEach(function (mutation) {
      treeUUID(mutation.target, false);

      var el = document.createElement(mutation.target.nodeName);
      el.setAttribute(UUID_KEY, pa.get(mutation.target, UUID_KEY));
      patch.appendChild(el);

      switch (mutation.type) {
        case 'attributes':
          el.setAttribute(mutation.attributeName, mutation.target.getAttribute(mutation.attributeName));
          break;

        case 'childList':
          mutation.addedNodes.forEach((m) => {
            treeUUID(m, true);
            el.appendChild(cloneWithUUID(m));
          });

          mutation.removedNodes.forEach((m) => {
            var removed = document.createElement('dead');
            removed.setAttribute(UUID_KEY, pa.get(m, UUID_KEY));
            el.appendChild(removed);
          });
          break;

        default:
          console.error(`Unknown mutation type '${mutation.type}'.`);
          break;
      }

      // packets.push(packet);
    });

    broadcast(patch.outerHTML);

    // broadcast({
    //   type: 'mutation',
    //   mutations: packets
    // });
  });

  // configuration of the observer:
  var config = { attributes: true, subtree: true, childList: true, characterData: true };

  observer.observe(root, config);
}

module.exports = Patch;
