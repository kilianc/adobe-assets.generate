module.exports = function timW2Kilian(tree) {
  var paths = []

  function timW2KilianWalker(t, parent) {
    if (parent === undefined) parent = '/'

    return t.map(function (subtree) {
      if (undefined === subtree.group || 0 === subtree.group.length) {
        paths.push(parent + subtree.ID)
        return parent + subtree.ID
      }
      return timW2KilianWalker(subtree.group, parent + subtree.ID + '/')
    })
  }

  timW2KilianWalker(tree)

  return paths
}