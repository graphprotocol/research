import { map, range } from 'lodash/fp'

/**
 * Extracts a list of objects representing one or more entity types from a storage backend.
 * Is injected with clients for the various available storage backends.
 * Does not use actual Ethereum or IPFS addresses.
 * @param  {Object} ipfs     A client for interacting with an IPFS storage backend.
 * @param  {Object} options  An object which may contain clients for storage adapters.
 */
export function* extract(data, { adapters }) {
  const { ipfs } = adapters
  const originListing = data
  // Need to pretend that entityCount can be arbitrarily large
  const entityCount = originListing.listingsLength()
  for (let i = 0; i < entityCount; i++) {
    let listing = originListing.getListing(i)
    let [index, lister, ipfsHash, price, unitsAvailable] = listing
    yield ipfs.block
      .get(`Qm${entity.ipfsHash}`)
      .then(data => JSON.parse(data))
      .then(ipfsObject => ({
        index: entity.index,
        lister: entity.lister,
        price: entity.price,
        unitsAvailable: unitsAvailable,
        listingData: ipfsObject.data,
      }))
  }
}

/**
 * A transform function to be applied to each entity individually that is returned
 * from the extract function.
 * @param  {Object} entity  A single entity being transformed.
 * @param  {Object} options An object which may contain clients for storage adapters.
 */
export const transform = (entity, _) => {
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
 * @param  {Object}   entity       An entity returned from the transform stage of ETL pipeline.
 * @param  {Function} loadEntity   A function to load entities, accepts entityType and entityData
 * @param  {Object}   options      An object which may contain clients for storage adapters.
 */
export const load = (entity, loadEntity, _) => {
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
 * @param  {Object}   options       An object which may contain clients for storage adapters.
 */
export const update = (data, triggerUpdate, _) => {
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
