// RXJS V6
const Rx = require('rxjs')

const { fromEventPattern } = Rx
const { filter, map } = Rx.operators

const processEvents = (memeRegistry, db, { config, adapters }) => {
  // Instance of web3 connected to JSON RPC of Indexing Node's geth
  const { web3 } = adapters
  const { memeABI } = config
  const MemeContract = web3.contract(JSON.Parse(memeABI))

  const registryEntryEvent$ = fromEventPattern(
    // Add handler
    handler => {
      memeRegistry.RegistryEntryEvent().watch(handler)
    },
    // Remove handler, unused since web3 doesn't provide a cleanup method
    handler => {},
    // Selector maps the handler arguments to a single value
    (error, event) => ({ error, event }),
  ).pipe(
    map(({ error, event }) => {
      if (error) {
        throw new Error(error)
      } else {
        return event
      }
    }),
    map(({ args: { registryEntry, timestamp, ...restArgs }, blockNumber }) => ({
      blockNumber,
      args,
      data: {
        regEntry_address: registryEntry,
        regEntry_createdOn: timestamp,
      },
      memeContract: MemeContract.at(registryEntry),
    })),
  )

  // TODO: Listen on other RegistryEntryEvent eventTypes (voteRewardClaimed, challengeRewardClaimed, voteRevealed)
  const constructedEvent$ = registryEntryEvent$.pipe(
    filter(({ args: { eventType } }) => eventType === 'constructed'),
  )

  const challengeCreatedEvent$ = registryEntryEvent$.pipe(
    filter(({ args: { eventType } }) => eventType === 'challengeCreated'),
  )

  constructedEvent$.pipe(
    map(({ data, blockNumber, memeContract }) => {
      const [
        version,
        status,
        creator,
        deposit,
        challengePeriodEnd,
      ] = memeContract.loadRegistryEntry(blockNumber)

      const [metaHash, totalSupply, totalMinted, tokenIdStart] = memeContract.loadMeme(
        blockNumber,
      )

      return {
        ...data,
        regEntry_version: version,
        regEntry_status: status,
        regEntry_creator: creator,
        regEntry_deposit: deposit,
        regEntry_challengePeriodEnd: challengePeriodEnd,
        // Not yet implemented (Hardcoded)
        meme_title: null,
        // IPFS?
        meme_number: Int,
        meme_metaHash: metaHash,
        // Not yet implemented (Hardcoded)
        meme_imageHash: null,
        meme_totalSupply: totalSupply,
        meme_totalMinted: totalMinted,
        meme_tokenIdStart: tokenIdStart,
        meme_totalTradeVolume: null,
        meme_totalTradeVolumeRank: null,
        // IPFS?
        meme_tags: null,
      }
    }),
  ).subscribe(meme =>
    // Adds 'Meme' enttiy with ID set to the Meme's contract address
    db.add('Meme', meme.regEntry_address, meme)
  )

  challengeCreatedEvent$.pipe(
    map(({ data, blockNumber, memeContract, args: { timestamp } }) => {
      const [
        challengePeriodEnd,
        challenger,
        rewardPool,
        metaHash,
        commitPeriodEnd,
        revealPeriodEnd,
        votesFor,
        votesAgainst,
        claimedRewardOn,
        _voteQuorum,
      ] = memeContract.loadRegistryEntryChallenge(blockNumber)
      return {
        ...data,
        challenge_challenger: challenger,
        challenge_createdOn: timestamp,
        // Is this in challenge meta hash?
        challenge_comment: null,
        // Where is this specified? Not implemented yet?
        challenge_votingToken: null,
        challenge_rewardPool: rewardPool,
        challenge_commitPeriodEnd: commitPeriodEnd,
        challenge_revealPeriodEnd: revealPeriodEnd,
        challenge_votesFor: votesFor,
        challenge_votesAgainst: votesAgainst,
        challenge_votesTotal: votesAgainst + votesFor,
        challenge_claimedRewardOn: claimedRewardOn,
      }
    }),
  ).subscribe(meme => db.add('Meme', meme.regEntry_address, meme))
}

export default processEvents
