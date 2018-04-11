import { map, range } from "lodash/fp";

/**
 * Extracts a list of objects representing one or more entity types from a storage backend.
 * Is injected with clients for the various available storage backends.
 * Does not use actual Ethereum or IPFS addresses.
 * @param  {[type]} web3 A client for interacting with an Ethereum storage backend.
 * @param  {[type]} ipfs A client for interacting with an IPFS storage backend.
 */
export const extract = ({ web3, ipfs }) => {
  const abiCid = "QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ";
  return ipfs.block
    .get(abiCid)
    .then(block => {
      const abi = JSON.parse(block.data);
      const OriginListing = web3.eth.contract(abi);
      const originListing = OriginListing.at(
        "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d"
      );
      return originListing.listingsLength();
    })
    .then(range(0))
    .then(map(value => contract.getListing(value)))
    .then(
      map(([index, lister, ipfsHash, price, unitsAvailable]) => ({
        index,
        lister,
        ipfsHash,
        price,
        unitsAvailable
      }))
    )
    .then(entities => (
      Promise.all(
        entities.map(entity => (
          // OriginListing contract uses truncated IPFS hashes
          ipfs.block.get(`Qm${entity.ipfsHash}`)
          .then(data => JSON.parse(data));
          .then(ipfsObject => ({
            index: entity.index,
            lister: entity.lister,
            price: entity.price,
            unitsAvailable: unitsAvailable,
            listingData: ipfsObject.data,
          }))
        ))
      );
    ));
};

/**
 * A transform function to be applied to each entity individually that is returned
 * from the extract function.
 * @param  {[type]} entity [description]
 */
export const transform = (entity) => {
  const {index, lister, price, unitsAvailable, listingData} = entity
  return {
    ...listingData,
    id: index,
    lister,
    price,
    unitsAvailable,
  }
};

/**
 * A load function which loads entities of a specific type. Final step in the
 * ETL pipeline.
 *
 * @param  {[type]} entity       An entity returned from the transform stage of ETL pipeline.
 * @param  {[type]} loadEntity   A function to load entities, accepts entityType and entityData
 */
export const load = (entity, loadEntity) => {
  switch(entity.category) {
    case "ForSale":
      createEntity('ForSaleListing', entity)
    case "Housing":
      createEntity('HousingListing', entity)
    default:
  }
};

/**
 * The update function defines when reindexing should be triggered based on asynchronous
 * events at the storage layer.
 * @param  {[type]} web3          A client for interacting with an Ethereum storage backend.
 * @param  {[type]} ipfs          A client for interacting with an IPFS storage backend.
 * @param  {[type]} triggerUpdate A function to call anytime reindexing should occur.
 */
export const update = ({ ipfs, web3 }, triggerUpdate) => {
  const abiCid = "QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ";
  return ipfs.block
    .get(abiCid)
    .then(block => {
      const abi = JSON.parse(block.data);
      const OriginListing = web3.eth.contract(abi);
      const originListing = OriginListing.at(
        "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d"
      );
      const newListing = originListing.NewListing();
      const listingPurchases = originListing.ListingPurchased();
      newListing.watch((err) => {
        if (!err) {
          triggerUpdate()
        }
      })
      listingUpdate.watch((err) => {
        if (!err) {
          triggerUpdate()
        }
      })
    })
}
