/* globals MutationObserver */

/*

  Todo:

    * Character data support
    * Merge multiple updates into one packet

*/

var pa = require('./private-attributes');
var uuid = require('uuid');

const UUID_KEY = 'data-uuid';
const ROOT_UUID = '00000000-0000-0000-0000-000000000000';
const DEAD_NODE_NAME = 'dead';
const PATCH_NODE_NAME = 'patch';
const SNAPSHOT_NODE_NAME = 'snapshot';

function Patch (root, broadcast) {
  var document = root.ownerDocument;

  function generateUUID () {
    return uuid.v4();
  }

  // todo - add uuid to textNodes
  function treeUUID (el, childNodes) {
    var nodes = [el];

    if (childNodes && el.nodeType === 1) {
      nodes = nodes.concat(el.querySelectorAll('*'));
    }

    nodes.forEach((e) => {
      if (!pa.has(e, UUID_KEY)) {
        // if (e === root) {
        //   pa.set(e, UUID_KEY, ROOT_UUID);
        // } else {
        pa.set(e, UUID_KEY, generateUUID());
        // }
      }
    });
  }

  function cloneWithUUID (el) {
    var result;

    if (el.nodeType === 1) {
      result = el.cloneNode(false);
    } else if (el.nodeType === 3) {
      result = document.createTextNode(el.nodeValue);
    } else {
      throw new Error('Invalid node type to clone');
    }

    if (el.nodeType === 1) {
      result.setAttribute(UUID_KEY, pa.get(el, UUID_KEY));

      el.childNodes.forEach((n) => {
        if (n.nodeType === 1) {
          result.appendChild(cloneWithUUID(n));
        } else {
          result.appendChild(n.cloneNode(true));
        }
      });
    }

    return result;
  }

  this.getSnapshot = function () {
    var snapshot = document.createElement(SNAPSHOT_NODE_NAME);
    snapshot.appendChild(cloneWithUUID(root));
    return snapshot.outerHTML;
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
