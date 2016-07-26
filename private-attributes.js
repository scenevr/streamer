var privateAttributes = new WeakMap();

function setPrivateAttribute (element, name, value) {
  if (!privateAttributes.get(element)) {
    privateAttributes.set(element, {});
  }

  privateAttributes.get(element)[name] = value;
}

function getPrivateAttribute (element, name) {
  return privateAttributes.get(element) && privateAttributes.get(element)[name];
}

function hasPrivateAttribute (element, name) {
  return !!getPrivateAttribute(element, name);
}

function removePrivateAttribute (element, name) {
  if (privateAttributes.get(element)) {
    delete privateAttributes.get(element)[name];
  }
}

module.exports = {
  get: getPrivateAttribute,
  has: hasPrivateAttribute,
  set: setPrivateAttribute,
  remove: removePrivateAttribute
};
