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

declare class EthereumValue {
  type: string
  toInt256(): Int256
  toAddress(): Address
  toBytes32(): Bytes32
  toArray(): Array<EthereumValue>
}

// TODO
declare class Bytes {}

// TODO
declare class Event {
  address: Address
  args: Array<EthereumValue>
  blockHash: string
}


/**
 * Generated Types
 *
 * These would be generated from ABI and Data Source Definition, and likely
 * placed into a separate file.
 *
 */

declare class MemeContract {
  // ABI not necessary because already stored on the Rust side
  constructor (address: string)
  loadRegistryEntry(): Array<EthereumValue>
  loadMeme(): Array<EthereumValue>
}

declare class MemeAuctionContract {
  // ABI not necessary because already stored on the Rust side
  constructor (address: string)
  loadMemeAuction(): Array<EthereumValue>
}

declare class User {}

declare class Vote {}

declare class Tag {}

declare class MemeToken {
  memeToken_tokenId: i32
  memeToken_number: i32
  memeToken_owner: string
  memeToken_meme: string

  toBytes(): Bytes
}

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
  challenge_votes: Array<string>

  meme_title: string
  meme_number: i32
  meme_metaHash: string
  meme_imageHash: string
  meme_totalSupply: i32
  meme_totalMinted: i32
  meme_tokenIdStart: i32
  meme_totalTradeVolume: i32
  meme_totalTradeVolumeRank: i32
  meme_ownedMemeTokens: Array<string>
  meme_tags: Array<Tag>

  toBytes(): Bytes
}

declare class MemeAuction {
  memeAuction_address: string
  memeAuction_seller: string
  memeAuction_buyer: string
  memeAuction_startPrice: i32
  memeAuction_endPrice: i32
  memeAuction_duration: i32
  memeAuction_startedOn: i32
  memeAuction_boughtOn: i32
  memeAuction_status: i32
  memeAuction_memeToken: string

  toBytes(): Bytes
}


 /**
  * DB
  */

declare namespace db {
  /**
   * [add description]
   * @param  {string} entityType The type of the entity being added (i.e. 'User')
   * @param  {Bytes}  entity     The data for the enttiy being added.
   * @return {string}            The ID of the entity that was successfully added.
   */
  export function add(entityType: string, entity: Bytes): string
}

/**
 * This is what the user (developer) would actually write
 */
export function handleRegistryEntryEvent(event: Event): void {
  var registryEntryAddress: string = event.args[0].toAddress().toString()
  var eventType: string = event.args[1].toBytes32().toString()
  var eventData: Array<EthereumValue> = event.args[4].toArray()
  var meme = new Meme()
  if (eventType === 'constructed') {
    var memeContract = new MemeContract(registryEntryAddress)
    var registryEntryData = memeContract.loadRegistryEntry()
    var memeData = memeContract.loadMeme()
    meme = new Meme()
    meme.regEntry_address = registryEntryAddress
    meme.regEntry_version = registryEntryData[0].toInt256().toI32()

    // ETC.

    // Should we replace entity types with auto generated constants?
    db.add('Meme', meme.toBytes())

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
    var memeToken_owner = eventData[0]
    var tokenIdStart = eventData[1].toInt256().toI32()
    var tokenIdEnd = eventData[2].toInt256().toI32()
    var i = 0
    var memeToken = new MemeToken()
    var tokenIds: Array<string> = []
    for (var j = tokenIdStart; i <= tokenIdEnd; j++) {
      memeToken = new MemeToken()
      memeToken.memeToken_number = i
      memeToken.memeToken_tokenId = j
      memeToken.memeToken_owner = memeToken_owner.toAddress().toString()
      memeToken.memeToken_meme = registryEntryAddress
      tokenIds[i] = db.add('MemeToken', memeToken.toBytes())
      i++
    }
    meme = new Meme()
    meme.regEntry_address = registryEntryAddress
    meme.meme_ownedMemeTokens = tokenIds
    db.add('Meme', meme.toBytes())



  } else if (eventType === 'changeApplied') {
    // TODO
  }
}

export function handleMemeAuctionEvent(event: Event): void {
  var memeAuctionAddress: string = event.args[0].toAddress().toString()
  var eventType: string = event.args[1].toBytes32().toString()
  if (eventType === 'auctionStarted') {
    var memeAuctionContract = new MemeAuctionContract(memeAuctionAddress)
    var memeAuctionData = memeAuctionContract.loadMemeAuction()
    var memeAuction = new MemeAuction()
    memeAuction.memeAuction_address = memeAuctionAddress
    memeAuction.memeAuction_seller = memeAuctionData[0].toAddress().toString()

    // ETC.

    db.add('MemeAuction', memeAuction.toBytes())
  } else if (eventType === 'buy') {
    // TODO
  } else if (eventType === 'canceled') {
    // TODO
  }
}
