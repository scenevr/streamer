var pa = require('./private-attributes');

const UUID_KEY = 'data-uuid';
const ROOT_UUID = '00000000-0000-0000-0000-000000000000';
const DEAD_NODE_NAME = 'dead';
const PATCH_NODE_NAME = 'patch';
const SNAPSHOT_NODE_NAME = 'snapshot';

function Apply (root) {
  var document = root.ownerDocument;

  function onSnapshot (snapshot) {
    var child;

    if (document.importNode) {
      child = document.importNode(snapshot.firstChild);
    } else {
      child = snapshot.firstChild.cloneNode(true);
    }

    root.innerHTML = '';
    root.appendChild(child);
  }

  function onPatch (patch) {
    Array.from(patch.childNodes).forEach((n) => {
      var uuid = n.getAttribute(UUID_KEY);
      var target = root.querySelector(`[${UUID_KEY}=${uuid}]`);

      // Apply attributes
      for (var i = 0; i < n.attributes.length; i++) {
        var attribute = n.attributes[i];

        if (attribute.name === UUID_KEY) {
          continue;
        }

        target.setAttribute(attribute.name, attribute.value);
      }

      // Todo apply child changes
    });
  }

  this.onMessage = function (message) {
    console.log(message.outerHTML);

    if (message.nodeName.toLowerCase() === PATCH_NODE_NAME) {
      onPatch(message);
    } else if (message.nodeName.toLowerCase() === SNAPSHOT_NODE_NAME) {
      onSnapshot(message);
    } else {
      throw new Error(`Unknown message <${message.nodeName}/> in Apply#onMessage`);
    }

    // todo - return false if the message could not be applied (sync is broken)
    return true;
  };
}

module.exports = Apply;
