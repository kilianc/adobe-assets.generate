function getLayerPixmap (layerId, width, height) {
  var actionDescriptor = new ActionDescriptor()

  width = width || 10000
  height = height || 10000

  actionDescriptor.putInteger(stringIDToTypeID('width'), 10000)
  actionDescriptor.putInteger(stringIDToTypeID('height'), 10000)
  actionDescriptor.putInteger(stringIDToTypeID('format'), 2)
  actionDescriptor.putInteger(stringIDToTypeID('layerID'), layerId)

  return executeAction(stringIDToTypeID('sendLayerThumbnailToNetworkClient'), actionDescriptor, DialogModes.NO)
}