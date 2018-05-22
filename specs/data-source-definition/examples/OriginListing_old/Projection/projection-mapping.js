const configureIPFSResolver = resolvers =>
  resolvers.ipfs.files.json
    // Using a string here guarantees that we control function execution, and that
    // there are no closures.
    .transformKey('key => "QM"+key')


const listingProjector = (storageRoot, resolvers) =>
  storageRoot
    .get('listings')
    .resolve('ipfsHash', configureIPFSResolver(resolvers))
    .rename(['index', 'id'], ['ipfsHash', 'data'])
    .selectFields(
      'index',
      'lister',
      'price',
      'unitsAvailable',
      ['data', 'schema']
      ['data', 'category'],
      ['data', 'description'],
    )
    .flatten()

export default {
  ForSaleListing: listingProjector
    .filter('schema','https://localhost:3000/schemas/for-sale.json')
    .excludeFields('schema'),
  AnnouncementListing: listingProjector
    .filter('schema','https://localhost:3000/schemas/announcement.json')
    .excludeFields('schema'),
}
