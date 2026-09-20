const noop = async () => undefined;
const empty = async () => null;
const emptyKeys = async () => [];
const emptyPairs = async () => [];

module.exports = {
  setItem: noop,
  getItem: empty,
  removeItem: noop,
  mergeItem: noop,
  clear: noop,
  getAllKeys: emptyKeys,
  multiGet: emptyPairs,
  multiSet: noop,
  multiRemove: noop,
};
