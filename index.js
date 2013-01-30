var fs = require('fs'),
    resolve = require('path').resolve,
    basename = require('path').basename,
    mkdirp = require('mkdirp').sync,
    convert = require('./lib/convert'),
    getDocumentInfoPaths = require('./lib/getdocumentinfopaths'),
    timW2Kilian = require('./lib/timw2kilian'),
    xpm2canvas = require('./lib/xpm2canvas'),
    xpm2png = require('./lib/xpm2png'),
    xpm = require('./lib/xpm'),
    jsx = require('./jsx')

var ps
var layers = {}
var activeDocumentPath, activeDocumentBasename
var spritesheets = {}

module.exports = function loadAssetsDumper(photoshop) {
  ps = photoshop
  main()
}

function main() {
  var events = [
    'layerChangedPixels',
    'layerChangedName',
    'layerChangedOpacity',
    'layerChangedProtection',
    'layerChangedPosition',
    'layerChangedVisibility',
    'layerRemoved',
    'layerAdded',
    'layerChangedGeneratedContent',
    'layerChangedBlendMode',
    'layerChangedText',
    'layerChangedPath',
    'layerChangedTransform',
    'layerChangedFX',
    'layerChangedRasterize'
  ]

  ps.on('error', console.error)

  ps.on('documentInfo', function (documentInfo) {
    var paths = getDocumentInfoPaths(documentInfo.imageEvents.imageChangedLayerOrder)

    documentInfo.layerEvents.forEach(function (layerData) {
      var layerId = layerData.layerID

      layers[layerId] = {
        layerId: layerId,
        name: layerData.layerChangedName,
        path: paths[layerId].split('/').slice(1)
      }

      parseLayer(layerId)
    })
  })

  ps.on('layerAdded', function (event) {
    layers[event.layerId] = { layerId: event.layerId }
  })

  ps.on('layerChangedName', function (event) {
    var layer = layers[event.layerId]
    removeAsset(layer.name)
    layer.name = event.data
  })

  ps.on('imageChangedLayerOrder', function (event) {
    var paths = timW2Kilian(event.data, paths)

    // notify old and new paths
    paths.forEach(function (path) {
      var layerId = path.split('/').pop()
      var layer = layers[layerId]
      layer.path && layer.path.forEach(parseLayer)
      layer.path = path.split('/').slice(1)
      layer.path.forEach(parseLayer)
    })
  })

  ps.on('currentDocumentChanged', function (data) {
    ps.execute(jsx.getActiveDocumentPath(), function (err, response) {
      if (err) return console.error(err)

      activeDocumentPath = response.body ? JSON.parse(response.body) : 'NOT_SAVED_YET'
      activeDocumentBasename = basename(activeDocumentPath, '.psd')

      console.error({ name: 'log', data: 'start parsing ' + activeDocumentPath })

      ps.execute(jsx.sendDocumentInfoToNetworkClient(), function (err, response) {
        if (err) return console.error(err)
      })
    })
  }).emit('currentDocumentChanged')

  ps.on('save', function () {
    if ('NOT_SAVED_YET' === activeDocumentPath) ps.emit('currentDocumentChanged')
  })

  events.forEach(function (eventName) {
    ps.on(eventName, function (event) {
      var path = layers[event.layerId].path
      path && path.forEach(parseLayer)
    })
  })

  ps.on('layerRemoved', function (event) {
    var layer = layers[event.layerId]
    delete layers[event.layerId]
    removeAsset(layer.name)
  })
}

function parseLayer(layerId) {
  if ('NOT_SAVED_YET' === activeDocumentPath) return

  var layer = layers[layerId]
  var format = getAssetFormat(layer.name)

  if (!format) return

  console.log({ name: 'log', data: format })
  console.error({ name: 'log', data: 'assets dump queued' })
  clearTimeout(layer.timeout)
  layer.timeout = setTimeout(function () { dumpAsset(layerId, format) }, 300)
}

function dumpAsset(layerId, assetFormat) {
  ps.execute(jsx.getLayerPixmap(layerId), function (err, response, pixmap) {
    if (err) return console.error(err)

    var layer = layers[layerId]
    var canvas = xpm2canvas(pixmap.buffer)
    var args = ['-size', canvas.width + 'x' + canvas.height]

    if ('.jpg' === assetFormat.ext) {
      canvas.makeWhiteBg()
      args = ['-quality', Math.round(assetFormat.quality / 12 * 100)]
    }

    args = args.concat(['-', assetFormat.format + ':-'])

    var proc = convert(args)
    var pngStream = canvas.createPNGStream()
    var fileStream = fs.createWriteStream(getAssetPath(layer.name))
    var stderr = ''

    proc.stderr.on('data', function (chunk) { stderr += chunk; })
    proc.stdin.on('error', function () { pngStream.removeAllListeners() })
    pngStream.pipe(proc.stdin)
    proc.stdout.pipe(fileStream)
    proc.stderr.on('close', function (chunk) {
      stderr && console.error({ name: 'log', data: 'imagemagick err: ' + stderr })
    })
  })
}

function getAssetFormat(layerName) {
  var match

  // normalize layer name
  if (/\.(.+)( copy( [0-9]+)?)$/.test(layerName)) {
    layerName = layerName.replace(/\.(.+)( copy( [0-9]+)?)$/, '$2.$1')
  }

  if (/(.+)\.png(8|24|32)?$/.test(layerName)) {
    match = layerName.match(/(.+)\.png(8|24|32)?$/)
    return {
      basename: normalizeFilename(match[1]),
      ext: '.png',
      format: 'PNG' + (parseInt(match[3]) || ''),
      dir: 'imgs'
    }
  }

  if (/(.+)\.jpe?g(@(\d{1,2})?)?$/.test(layerName)) {
    match = layerName.match(/(.+)\.jpe?g(@(\d{1,2})?)?$/)
    return {
      basename: normalizeFilename(match[1]),
      ext: '.jpg',
      format: 'JPEG',
      quality: match[3] || 8,
      dir: 'imgs'
    }
  }

  if (/\.gif$/.test(layerName)) {
    match = layerName.match(/(.+)\.gif$/)
    return {
      basename: normalizeFilename(match[1]),
      ext: '.gif',
      format: 'GIF',
      dir: 'imgs'
    }
  }
}

function removeAsset(layerName) {
  var path = getAssetPath(layerName)
  path && fs.unlink(path)
}

function getAssetPath(layerName) {
  var assetFormat = getAssetFormat(layerName)

  if (!assetFormat) return

  var assetsPath = resolve(activeDocumentPath, '../', activeDocumentBasename, assetFormat.dir)

  if (!fs.existsSync(assetsPath)) {
    console.error({ name: 'log', data: 'creating assetsPath ' + assetsPath })
    mkdirp(assetsPath)
  }

  return resolve(assetsPath, assetFormat.basename + assetFormat.ext)
}

function normalizeFilename(basename) {
  return basename.replace(/[^A-Za-z0-9]/g, '_')
}