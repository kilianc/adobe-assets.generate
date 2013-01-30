var resolve = require('path').resolve,
    spawn = require('child_process').spawn

// bind the convert function for an easy future use
module.exports = (function () {
  var execpath = resolve(__dirname, '../bin/ImageMagick-6.8.0/bin', 'convert')
  var env = {
    DYLD_LIBRARY_PATH: resolve(__dirname, '../dylib') + ':' + resolve(__dirname, '../bin/ImageMagick-6.8.0/lib'),
    MAGICK_HOME: resolve(__dirname, '../bin/ImageMagick-6.8.0/lib')
  }

  return function convert(args) {
    return spawn(execpath, args, { env: env })
  }
})()
