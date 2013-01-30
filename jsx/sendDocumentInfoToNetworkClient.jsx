function sendDocumentInfoToNetworkClient(documentId) {
  return executeAction(
    stringIDToTypeID('sendDocumentInfoToNetworkClient'),
    new ActionDescriptor(),
    DialogModes.NO
  )
}