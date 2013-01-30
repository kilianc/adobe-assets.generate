var Pixmap = module.exports = function Pixmap(buffer) {
  if (!(this instanceof Pixmap)) {
    return new Pixmap(buffer)
  }

  this.format = buffer.readUInt8(0),
  this.width = buffer.readUInt32BE(1),
  this.height = buffer.readUInt32BE(5),
  this.rowBytes = buffer.readUInt32BE(9),
  this.colorMode = buffer.readUInt8(13),
  this.channelCount = buffer.readUInt8(14),
  this.bitsPerChannel = buffer.readUInt8(15)
  this.pixels = buffer.slice(16, 16 + this.width * this.height * this.channelCount)
  this.bytesPerPixel = this.bitsPerChannel / 8 * this.channelCount
  this.padding = this.rowBytes - this.width * this.channelCount
  this.readChannel = getReadChannel(this.bitsPerChannel)
  this.getPixel = getGetPixel(this.channelCount)
}

Pixmap.prototype.getRawPixel = function (n) {
  var i = n * this.bytesPerPixel
  return this.pixels.slice(i, i + this.bytesPerPixel)
}

function getReadChannel(bitsPerChannel) {
  if (16 === bitsPerChannel) return Buffer.prototype.readUInt16BE
  if (8  === bitsPerChannel) return Buffer.prototype.readUInt8
  if (32 === bitsPerChannel) return Buffer.prototype.readUInt32BE
}

function getGetPixel(channelCount) {
  if (4 === channelCount) return getPixel4
  if (3 === channelCount) return getPixel3
  if (1 === channelCount) return getPixel1
}

function getPixel1(n) {
  var pixel = this.getRawPixel(n)
  var grey = this.readChannel.call(pixel, 0)
  return {
    r: grey,
    g: grey,
    b: grey,
    a: 255
  }
}

function getPixel3(n) {
  var pixel = this.getRawPixel(n)
  return {
    r: this.readChannel.call(pixel, 2),
    g: this.readChannel.call(pixel, 1),
    b: this.readChannel.call(pixel),
    a: 255
  }
}

function getPixel4(n) {
  var pixel = this.getRawPixel(n)
  return {
    r: this.readChannel.call(pixel, 1),
    g: this.readChannel.call(pixel, 2),
    b: this.readChannel.call(pixel, 3),
    a: this.readChannel.call(pixel, 0)
  }
}