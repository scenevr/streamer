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

function hasPrivateAttribute (element, name) {
  return !!(privateAttributes[element] && privateAttributes[element][name]);
}

function removePrivateAttribute (element, name) {
  if (privateAttributes[element]) {
    delete privateAttributes[element][name];
  }
}

module.exports = {
  get: getPrivateAttribute,
  has: hasPrivateAttribute,
  set: setPrivateAttribute,
  remove: removePrivateAttribute
};
