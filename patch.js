/* globals MutationObserver */

/*

  Todo:

    * Character data support
    * Merge multiple updates into one packet

*/

var pa = require('./private-attributes');
var uuid = require('uuid');

const UUID_KEY = 'data-uuid';
const DEAD_NODE_NAME = 'dead';
const PATCH_NODE_NAME = 'patch';

function Patch (root, broadcast) {
  var document = root.ownerDocument;

  function generateUUID () {
    return uuid.v4();
  }

  // todo - add uuid to textNodes
  function treeUUID (el, childNodes) {
    var nodes = [el];

    if (childNodes) {
      nodes = nodes.concat(el.querySelectorAll('*'));
    }

    nodes.forEach((e) => {
      if (!pa.has(e, UUID_KEY)) {
        pa.set(e, UUID_KEY, generateUUID());
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

  treeUUID(root, true);

  var observer = new MutationObserver(function (mutations) {
    var patch = document.createElement(PATCH_NODE_NAME);

    // Cache attribute mutations to merge them
    var attributeMutations = {};

    mutations.forEach(function (mutation) {
      treeUUID(mutation.target, true);

      var uuid = pa.get(mutation.target, UUID_KEY);
      var el;

      if (mutation.type === 'attributes' && attributeMutations[uuid]) {
        el = attributeMutations[uuid];
      } else {
        el = document.createElement(mutation.target.nodeName);
        el.setAttribute(UUID_KEY, uuid);
        patch.appendChild(el);
      }

      if (mutation.type === 'attributes') {
        attributeMutations[uuid] = el;
      }

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
            var removed = document.createElement(DEAD_NODE_NAME);
            removed.setAttribute(UUID_KEY, pa.get(m, UUID_KEY));
            el.appendChild(removed);
          });
          break;

        default:
          console.error(`Unknown mutation type '${mutation.type}'.`);
          break;
      }
    });

    broadcast(patch.outerHTML);
  });

  var config = { attributes: true, subtree: true, childList: true, characterData: true };
  observer.observe(root, config);
}

module.exports = Patch;
