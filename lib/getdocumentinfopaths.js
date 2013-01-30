module.exports = function getDocumentInfoPaths(tree) {
  var paths = {}

  function getDocumentInfoPathsWalker(t, parent) {
    if (parent === undefined) parent = '/'

    return t.map(function (subtree) {
      paths[subtree.ID] = parent + subtree.ID

      if (undefined === subtree.group || 0 === subtree.group.length) {
        return parent + subtree.ID
      }

      return getDocumentInfoPathsWalker(subtree.group, parent + subtree.ID + '/')
    })
  }

  getDocumentInfoPathsWalker(tree)

  return paths
}