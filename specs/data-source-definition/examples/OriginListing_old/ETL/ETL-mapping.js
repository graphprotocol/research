import { map, range } from 'lodash/fp'

/**
 * Extracts a list of objects representing one or more entity types from a storage backend.
 * Is injected with clients for the various available storage backends.
 * Does not use actual Ethereum or IPFS addresses.
 * @param  {Object} ipfs A client for interacting with an IPFS storage backend.
 */
export const extract = (data, { ipfs }) => {
  const originListing = data
  const entityCount = originListing.listingsLength()
  const entities = range(0, entityCount)
    .map(value => originListing.getListing(value))
    .map(([index, lister, ipfsHash, price, unitsAvailable]) => ({
      index,
      lister,
      ipfsHash,
      price,
      unitsAvailable,
    }))
  return Promise.all(
    entities.map(entity =>
      // OriginListing contract uses truncated IPFS hashes
      ipfs.block
        .get(`Qm${entity.ipfsHash}`)
        .then(data => JSON.parse(data))
        .then(ipfsObject => ({
          index: entity.index,
          lister: entity.lister,
          price: entity.price,
          unitsAvailable: unitsAvailable,
          listingData: ipfsObject.data,
        })),
    ),
  )
}

/**
 * A transform function to be applied to each entity individually that is returned
 * from the extract function.
 * @param  {Object} entity A single entity being transformed.
 */
export const transform = entity => {
  const { index, lister, price, unitsAvailable, listingData } = entity
  return {
    ...listingData,
    id: index,
    lister,
    price,
    unitsAvailable,
  }
}

/**
 * A load function which loads entities of a specific type. Final step in the
 * ETL pipeline.
 *
 * @param  {Object} entity       An entity returned from the transform stage of ETL pipeline.
 * @param  {Function} loadEntity   A function to load entities, accepts entityType and entityData
 */
export const load = (entity, loadEntity) => {
  switch (entity.category) {
    case 'ForSale':
      createEntity('ForSaleListing', entity)
    case 'Housing':
      createEntity('HousingListing', entity)
    default:
  }
}

/**
 * The update function defines when reindexing should be triggered based on asynchronous
 * events at the storage layer.
 * @param  {Object}   data          An object or class instance representing the data being mapped.
 * @param  {Function} triggerUpdate A function to call anytime reindexing should occur.
 */
export const update = (data, triggerUpdate) => {
  const originListing = data
  const newListing = originListing.NewListing()
  const listingPurchases = originListing.ListingPurchased()
  newListing.watch(err => {
    if (!err) {
      triggerUpdate()
    }
  })
  listingUpdate.watch(err => {
    if (!err) {
      triggerUpdate()
    }
  })
}
