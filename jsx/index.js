var fs = require('fs')

var json = loadJSX('vendor/json3')
var es5 = loadJSX('vendor/es5-sham') + loadJSX('vendor/es5-shim')

function loadJSX(name) {
  try {
    return fs.readFileSync(__dirname + '/' + name + '.jsx', 'utf8')
  } catch (err) {
    return fs.readFileSync(__dirname + '/' + name + '.js', 'utf8')
  }
}

// exports
var getLayerPixmap = loadJSX('getLayerPixmap')
module.exports.getLayerPixmap = function (layerId, options) {
  return getLayerPixmap + ';getLayerPixmap(' + layerId + ')'
}

var getActiveDocumentPath = loadJSX('getActiveDocumentPath')
module.exports.getActiveDocumentPath = function (documentId) {
  return json + es5 + getActiveDocumentPath + ';getActiveDocumentPath(' + documentId + ')'
}

var sendDocumentInfoToNetworkClient = loadJSX('sendDocumentInfoToNetworkClient')
module.exports.sendDocumentInfoToNetworkClient = function (documentId) {
  return sendDocumentInfoToNetworkClient + ';sendDocumentInfoToNetworkClient(' + documentId + ')'
}