export default (memeRegistry, db, { config, adapters }) => {
  // Instance of web3 connected to JSON RPC of Query Node's geth
  const { web3 } = adapters
  const { memeABI } = config

  const eventSubscriber = memeRegistry.events.RegistryEntryEvent({
    // Filter parameters, fromBlock etc.
  })

  eventSubscriber.on('error', error => {
    throw error
  })

  eventSubscriber.on('changed', event => {
    // Block reorgs, see documentation for "changed" on
    // https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#contract-events-return
  })

  eventSubscriber.on('data', event => {
    const { address, blockNumber, returnValues } = event
    const { eventType, registryEntry, timestamp } = returnValues

    const meme = new web3.eth.Contract(memeABI, registryEntry)

    switch (eventType) {
      // From RegistryEntry
      case 'constructed': {
        const [
          version,
          status,
          creator,
          deposit,
          challengePeriodEnd,
        ] = meme.loadRegistryEntry(blockNumber)
        const [metaHash, totalSupply, totalMinted, tokenIdStart] = meme.loadMeme(
          blockNumber
        )

        const data = {
          id: registryEntry,

          regEntry_address: registryEntry,
          regEntry_version: version,
          regEntry_status: status,
          regEntry_creator: creator,
          regEntry_deposit: deposit,
          regEntry_createdOn: timestamp,
          regEntry_challengePeriodEnd: challengePeriodEnd,

          meme_title: null, // ?
          meme_number: null, // ?
          meme_metaHash: metaHash,
          meme_imageHash: null, // ?
          meme_totalSupply: totalSupply,
          meme_totalMinted: totalMinted,
          meme_tokenIdStart: tokenIdStart,
          meme_totalTradeVolume: null, // ?
          meme_totalTradeVolumeRank: null, // ?
          meme_tags: [], // ?
        }

        db.add('Meme', meme)
        return
      }

      case 'challengeCreated': {
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
        ] = meme.loadRegistryEntryChallenge(blockNumber)

        const data = {
          id: registryEntry,

          challenge_challenger: challenger,
          challenge_createdOn: timestamp,
          challenge_comment: null, // ?
          challenge_votingToken: null, // ?
          challenge_rewardPool: rewardPool,
          challenge_commitPeriodEnd: commitPeriodEnd,
          challenge_revealPeriodEnd: revealPeriodEnd,
          challenge_votesFor: votesFor,
          challenge_votesAgainst: votesAgainst,
          challenge_votesTotal: votesAgainst + votesFor,
          challenge_claimedRewardOn: claimedRewardOn,
          challenge_votes: [], // 1:n reference to Vote
        }

        db.update('Meme', data)
        return
      }
      case 'voteCommitted': {
      }
      case 'voteRevealed': {
      }
      case 'voteRewardClaimed': {
      }
      case 'challengeRewardClaimed': {
      }

      // From Meme
      case 'depositTransferred': {
      }
      case 'minted': {
      }

      // From ParamChange
      case 'changeApplied': {
      }
    }
  })
}
