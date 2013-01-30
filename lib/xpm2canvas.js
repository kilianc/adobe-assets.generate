var Canvas = require('canvas'),
    xpm = require('./xpm')

module.exports = function xpm2canvas(buffer) {
  var pixmap = xpm(buffer)
  var pixels = pixmap.pixels
  var rowBytes = pixmap.width * pixmap.channelCount
  var channelCount = pixmap.channelCount
  var padding = pixmap.padding

  var canvas = new Canvas(pixmap.width, pixmap.height)
  var ctx = canvas.getContext('2d')
  var imageData = ctx.createImageData(pixmap.width, pixmap.height)

  // get functions based on format
  var readChannel = getReadFunction(pixmap.bitsPerChannel)
  var setPixel = getSetPixel(pixmap.channelCount, readChannel)

  var bufferIndex = 0
  var bufferLength = pixels.length
  var bitmapIndex = 0

  // parse pixmap
  while(bufferIndex < bufferLength) {
    if (!(bufferIndex % rowBytes)) bufferIndex += padding
    setPixel(imageData, pixels, bitmapIndex, bufferIndex)
    bitmapIndex += 4 // canvas has 4 channels
    bufferIndex += channelCount
  }

  ctx.putImageData(imageData, 0, 0)

  canvas.makeWhiteBg = makeWhiteBg

  return canvas
}

function makeWhiteBg() {
  var ctx = this.getContext('2d')
  var globalCompositeOperation = ctx.globalCompositeOperation

  ctx.globalCompositeOperation = 'destination-over'
  ctx.drawImage(getSolidCanvas(this.width, this.height, '#fff'), 0, 0)
  ctx.globalCompositeOperation = globalCompositeOperation
}

function getSolidCanvas(width, height, color) {
  var canvas = new Canvas(width, height)
  var ctx = canvas.getContext('2d')
  ctx.fillStyle = color
  ctx.fillRect(0, 0, width, height)
  return canvas
}

function getReadFunction(bitsPerChannel) {
  if (8  === bitsPerChannel) return Buffer.prototype.readUInt8
  if (16 === bitsPerChannel) return Buffer.prototype.readUInt16BE
  if (32 === bitsPerChannel) return Buffer.prototype.readUInt32BE
}

function getSetPixel(channelCount, read) {
  if (4 === channelCount) return setPixel4.bind(null, read)
  if (3 === channelCount) return setPixel3.bind(null, read)
  if (1 === channelCount) return setPixel1.bind(null, read)
}

function setPixel1(read, imageData, pixels, bitmapIndex, bufferIndex) {
  var grey = read.call(pixels, bufferIndex)
  imageData.data[bitmapIndex]     = grey // r
  imageData.data[bitmapIndex + 1] = grey // g
  imageData.data[bitmapIndex + 2] = grey // b
  imageData.data[bitmapIndex + 3] = 255  // a
}

function setPixel3(read, imageData, pixels, bitmapIndex, bufferIndex) {
  imageData.data[bitmapIndex]     = read.call(pixels, bufferIndex + 2) // r
  imageData.data[bitmapIndex + 1] = read.call(pixels, bufferIndex + 1) // g
  imageData.data[bitmapIndex + 2] = read.call(pixels, bufferIndex)     // b
  imageData.data[bitmapIndex + 3] = 255                                // a
}

function setPixel4(read, imageData, pixels, bitmapIndex, bufferIndex) {
  imageData.data[bitmapIndex]     = read.call(pixels, bufferIndex + 1) // r
  imageData.data[bitmapIndex + 1] = read.call(pixels, bufferIndex + 2) // g
  imageData.data[bitmapIndex + 2] = read.call(pixels, bufferIndex + 3) // b
  imageData.data[bitmapIndex + 3] = read.call(pixels, bufferIndex)     // a
}