/**
 * This file is written in AssemblyScript, a subset of TypeScript
 * which compiles to WASM.
 *
 * See https://github.com/AssemblyScript/assemblyscript
 */

import "allocator/tlsf"

/**
 * Common types for working with Ethereum blockchain data. These would likely
 * be placed into a separate declarations file.
 */

// TODO
declare class Int256 {
  // TODO: Factor out into utility functions
  toI32(): i32
}

// TODO
declare class Address {
 toString(): string
}

// TODO
declare class Bytes32 {
  toString(): string
}

// TODO
declare class UInt256 {
  toI32(): i32
}

// TODO
declare class Bytes {}

// TODO
declare class Event<Args> {
  address: Address
  args: Args
  blockHash: string
}

// TODO
declare class CBOR {

}


/**
 * Generated Types
 *
 * These would be generated from ABI and Data Source Definition, and likely
 * placed into a separate file.
 *
 */

declare class RegistryEventArgs {
  registryEntry: Address
  eventType: Bytes32
  version: UInt256
  timestamp: UInt256
  data: Array<UInt256>
}

declare class MemeAuctionEventArgs {
  memeAuction: Address
  eventType: Bytes32
  version: UInt256
  timestamp: UInt256
  data: Array<UInt256>
}

declare class LoadRegistryEntryResults {
  version: UInt256
  // This is an Enum in the smart contract, which Ethereum stores as a UInt256
  status: UInt256
  creator: Address
  deposit: UInt256
  challengePeriodEnd: UInt256
}

declare class LoadMemeResults {
  version: Bytes
  // This is an Enum in the smart contract, which Ethereum stores as a UInt256
  status: UInt256
  creator: Address
  deposit: UInt256
  challengePeriodEnd: UInt256
}

declare class LoadMemeAuctionResults {
  version: Bytes
  // This is an Enum in the smart contract, which Ethereum stores as a UInt256
  status: UInt256
  creator: Address
  deposit: UInt256
  challengePeriodEnd: UInt256
}

declare class MemeContract {
  // ABI not necessary because already stored on the Rust side
  constructor (address: Address)
  loadRegistryEntry(): LoadRegistryEntryResults
  loadMeme(): LoadMemeResults
}

declare class MemeAuctionContract {
  // ABI not necessary because already stored on the Rust side
  constructor (address: Address)
  loadMemeAuction(): LoadMemeAuctionResults
}

declare class User {}

declare class Vote {}

declare class Tag {}

declare class MemeToken {}

declare class Meme {
  id: string

  regEntry_address: string
  regEntry_version: i32
  regEntry_status: i32
  regEntry_creator: string
  regEntry_deposit: i32
  regEntry_createdOn: i32
  regEntry_challengePeriodEnd: i32

  // This should be the ID of a User entity
  challenge_challenger: string
  // Do we want to store Date as seconds since the epoch or ISO 8601 string?
  challenge_createdOn: i32
  challenge_comment: string
  challenge_votingToken: string
  challenge_commitPeriodEnd: i32
  challenge_revealPeriodEnd: i32
  challenge_votesFor: i32
  challenge_votesAgainst: i32
  challenge_votesTotal: i32
  challenge_claimedRewardOn: i32
  // This is modified from District0x's original schema (they define an parameter)
  challenge_votes: Array<Vote>

  meme_title: string
  meme_number: i32
  meme_metaHash: string
  meme_imageHash: string
  meme_totalSupply: i32
  meme_totalMinted: i32
  meme_tokenIdStart: i32
  meme_totalTradeVolume: i32
  meme_totalTradeVolumeRank: i32
  meme_ownedMemeToken: Array<MemeToken>
  meme_tags: Array<Tag>

  toCBOR(): Bytes
}

declare class MemeAuction {
  memeAuction_address: i32
  memeAuction_seller: User
  memeAuction_buyer: User
  memeAuction_startPrice: i32
  memeAuction_endPrice: i32
  memeAuction_duration: i32
  memeAuction_startedOn: i32
  memeAuction_boughtOn: i32
  memeAuction_status: i32
  memeAuction_memeToken: MemeToken

  toCBOR(): Bytes
}


 /**
  * DB
  */

declare namespace db {
  export function add(entityType: string, entity: Bytes): void
}

/**
 * This is what the user (developer) would actually write
 */
export function handleRegistryEntryEvent(event: Event<RegistryEventArgs> ): void {
  var eventType: string = event.args.eventType.toString()
  if (eventType === 'constructed') {
    var memeContract = new MemeContract(event.args.registryEntry)
    var registryEntryData = memeContract.loadRegistryEntry()
    var memeData = memeContract.loadMeme()
    var meme = new Meme()
    meme.regEntry_address = event.args.registryEntry.toString()
    meme.regEntry_version = registryEntryData.version.toI32()

    // ETC.

    // Should we replace entity types with auto generated constants?
    db.add('Meme', meme.toCBOR())

  } else if (eventType === 'challengeCreated') {
    // TODO
  } else if (eventType === 'voteCommitted') {
    // TODO
  } else if (eventType === 'voteRevealed') {
    // TODO
  } else if (eventType === 'challengeRewardClaimed') {
    // TODO
  } else if (eventType === 'depositTransferred') {
    // TODO
  } else if (eventType === 'minted') {
    // TODO
  } else if (eventType === 'changeApplied') {
    // TODO
  }
}

export function handleMemeAuctionEvent(event: Event<MemeAuctionEventArgs>): void {
  var eventType: string = event.args.eventType.toString()
  if (eventType === 'auctionStarted') {
    var memeAuctionContract = new MemeContract(event.args.memeAuction)
    var memeAuctionData = memeAuctionContract.loadMemeAuction()
    var memeAuction = new MemeAuction()
    
    // ETC.

    db.add('MemeAuction', memeAuction.toCBOR())
  } else if (eventType === 'buy') {
    // TODO
  } else if (eventType === 'canceled') {
    // TODO
  }
}
