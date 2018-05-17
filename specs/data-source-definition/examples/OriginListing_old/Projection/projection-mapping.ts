/**
 * A wrapper around contract storage. All methods are lazy, and return a new
 * StorageWrapper.
 *
 * Iterator methods must be passed in pure iteratees since execution will be lazy
 * and potentially parallelized.
 */
type StorageWrapper = {
  get: Function
  map: Function
  /**
    mapP could allows us to return a Promise from a map and continue
    working with the eventual value in future map operations.
   */
  mapP: Function
}
const listingProjector = (storageWrapper: StorageWrapper) =>
  storageWrapper
    /** 'listings' refers to name of top level variable in contract storage */
    .get('listings')
    .mapP(({ ipfsHash, ...listing }, { adapters: { ipfs } }) => {
      ipfs.files.get(`Qm${listing.ipfsHash}`)
      .then(files => JSON.parse(files[0]))
      .then(meta => ({ ...listing, ...meta }))
    })
    .map(({index, ...listing}) => ({ id: index, ...listing }))

export default {
  Listing: listingProjector
}
