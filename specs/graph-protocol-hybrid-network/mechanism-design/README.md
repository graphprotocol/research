# Mechanism Design

## Overview
The protocol implements a *work token* token model[<sup>1</sup>](#footnotes) in which Indexing Node operators stake deposits of Graph Tokens for particular datasets, called subgraphs, to gain the right to participate in the data retrieval marketplaces for that dataset--indexing data and responding to read requests in exchange for micropayments. This deposit is forfeit in the event that the work is not performed correctly, or is performed maliciously, as defined in the [slashing conditions](#dispute-resolution).

There are secondary mechanisms in the protocol that also require a staking of tokens, such as curation, stake delegation, and name registration, all of which will be expanded upon in their respective sections.

## Graph Token
We introduce a native token for the protocol, Graph Tokens, which are the only token that may be used for staking in the network. However, ETH or DAI is used for paying for read operations, thus reducing friction and balance sheet risk for end-users of dApps that query The Graph. Graph Tokens will have variable inflation to reward specific activities in the network, as described in [Inflation Rewards](#inflation-rewards).

## Governance
There are several parameters throughout this mechanism design that are set via a governance process. In the v1 specification, governance will consist of a multi-sig wallet contract controlled by the Graph Protocol team.

In future versions of the protocol, more decentralized forms of governance will explored.

## Staking
Indexing Nodes deposit a `stakingAmount` of Graph Tokens to process read requests for a specific dataset, which is identified by its `subgraphID`.

For a `stakingAmount` to be considered valid, it must meet the following requirements:
 - `stakingAmount >= minStakingAmount` where `minStakingAmount` is set via governance.
 - The `stakingAmount` must be in the set of the top N staking amounts, where N is determined by the `maxIndexers` parameter that is set via governance.

Indexing Nodes that have staked for a dataset are not limited by the protocol in how many read requests they may process for that dataset. However, it may be assumed that Indexing Nodes with higher deposits will receive more read requests and, thus, collect more fees, if all else is equal, as this represents a greater economic security margin to the end user.

## Data Retrieval Market
Indexing Nodes which have staked to index a particular dataset, will be discoverable in the data retrieval market for that dataset.

Indexing Nodes compete to have the most compelling combination of economic security margin (the amount of tokens staked), performance and price to attract read requests from users of the network. See [Query Processing](../query-processing) for an example market interaction.

Indexing Nodes receive requests which include a [Read Operation](../messages#read-operation) and a Locked Transfer.

The Read Operation fully defines the data that is being requested, while the [Locked Transfer](../messages#locked-transfer) is a micropayment that is paid, conditional, on the Indexing Node producing a [Read Response](../messages#read-response) along with a signed [Attestation](../messages#attestation) message which certifies the response data is correct.

## Data Retrieval Pricing
Pricing in the data retrieval market is set according to the bandwidth and compute required to process a request.

Compute is priced as a `gasPrice`, denominated in ETH or DAI, where the `gas` required for a request is determined by the specific read operation and parameters. See [Read Interface](../read-interface) for operation specific gas prices.

Bandwidth is priced in `bytesPrice`, denominated in ETH or DAI, where `bytes` refers to the size of the `data` portion of the response, measured in bytes.

Indexing Nodes respond with their compute and bandwidth costs in response to the `getPrices` method in the [JSON-RPC API](../rpc-api).
## Verification

### Fisherman Service
A Fisherman Service is an economic agent who verifies read responses in exchange for a reward in cases where they detect that an Indexing Node has attested to an incorrect response, and the Fisherman successfully disputes the response on-chain.

In the v1 of the protocol, the Graph Protocol team will operate a Fisherman service. This is to accommodate the fact, that in the absence of forced errors in the v1 protocol, Fisherman rewards should go to zero overtime, and thus must have altruistic motives in order to perform their service.

### Dispute Resolution
Dispute resolution is handled through an on-chain dispute resolution process. In future versions of the protocol, this may involve programmatically verifying proofs or using a Truebit-style verification game, but in the v1 specification, the outcome of a dispute will be decided by a centralized arbitrator interacting with the on-chain dispute resolution process.

To dispute a response, a Fisherman must submit the attestation of the response they are disputing as well as a deposit.

**TODO** [Define deposit amount for Fisherman disputes](https://github.com/graphprotocol/research/issues/76)

In the event of a successful dispute the Indexing Node forfeits the entire deposit of tokens they staked on the dataset for which they produced an incorrect response. The Fisherman, in turn, receives a reward equal to a percentage of the slashed deposit.

**TODO** [Define slashing reward for successful disputes](https://github.com/graphprotocol/research/issues/77)

In the event of an unsuccessful dispute, the Fisherman forfeits the entire deposit they submitted with their dispute.

## Market Discovery
Market discovery is the process by which Indexing Nodes choose which datasets to index and serve data on.

When the data retrieval market for a particular dataset is active, an Indexing Node may observe payment activity on-chain to decide if it would be profitable to participate in that market.

With little to no activity for a newly created dataset, however, payment activity provides a poor signal. Instead, this signal to the network is provided by a *Curation Market*.[<sup>2</sup>](#footnotes)

### Curation Market
Curators are economic agents who earn rewards by betting on the future economic value of datasets, perhaps with the benefit of private information.

A Curator stakes a deposit of Graph Tokens for a particular dataset in exchange for dataset-specific *subgraph tokens*. These tokens entitle the holder to a portion of a curation reward, which is paid in Graph Tokens through inflation. See [Inflation Rewards](#inflation-rewards) for how curation reward is calculated for each dataset.

Subgraph tokens are issued according to a bonding curve, making it more expensive to mint subgraph tokens by locking up Graph Tokens as the amount of bonded tokens increases, thus making it more expensive to purchase a share of future curator inflation rewards.

**TODO** [Define bonding curve for curation market or bonding curve parameters](https://github.com/graphprotocol/research/issues/69).

## Inflation Rewards
The total monetary inflation rate of Graph Tokens over a given inflation period is the sum of its two constituent components:

`inflationRate = curatorRewardRate + participationRewardRate`

As indicated in the formula above, inflation is used to reward curation of datasets and participation in the network.

### Participation Adjusted Inflation
To encourage Graph Token holders to participate in the network, the protocol implements a participation-adjusted inflation[<sup>3</sup>](#footnotes) reward.

The participation reward to the entire network is calculated as a function of a `targetParticipationRate` that is set via governance. If `actualParticipationRate == targetParticipationRate`, then `participationRewardRate = 0`. Conversely, the lower the actual participation rate is relative to the target participation rate, the higher the participation reward.

**TODO** [Decide on actual function for relating `participationRewardRate` to `targetParticipationRate`](https://github.com/graphprotocol/research/issues/70).

To incentivize actual work being provided to the network, not just staking, the participation reward will be distributed to Indexing Nodes who are staking for datasets with the strongest market signal from curators.

 - Let `totalStakedForCuration` be the amount of Graph Tokens staked for curation in the entire network
 - Let `stakedForCuration[s]` be the amount staked for curation for a particular dataset `s`.
 - Let `stakedForIndexing[s]` be the total amount staked for indexing on a particular dataset `s`.
 - Let `stakedForIndexing[s][i]` be the amount staked for indexing by Indexer `i` on dataset `s`.

Then we can compute `participationReward[s][i]`, the participation reward allotted to Indexer `i` staked on dataset `s`, as follows:

`participationReward[s][i] = (stakedForCuration[s] / totalStakedForCuration) * (stakedForIndexing[s][i] / stakedForIndexing[s]) * participationRewardRate * totalTokenSupply`.

### Curator Inflation Reward
The `curationRewardRate` is defined as a percentage of the total Graph Token supply and is set via governance. As with the participation reward, it is paid via inflation.

Let `aggregateTransactionValue[s]` be the total value of all transactions in the data retrieval market for a dataset `s` over a given inflation period. We can define `curationReward[s]`, the total curation reward shared by all Curators of a dataset `s` over a given inflation period:

`curatorReward[s] = (aggregateTransactionValue[s] / totalTransactionValue) * curationRewardRate * totalTokenSupply`

The share of this dataset-specific curation reward that an individual Curator receives is determined according to the share of the curator reward they acquired in the [curation market](#curation-market).

### Inflation Periods
Inflation rewards are calculated over a period of time, measured in blocks, according to a `roundDuration` parameter that is set via governance.

**TODO** [How should round duration be set to balance gas costs and facilitating a dynamic market?](https://github.com/graphprotocol/research/issues/75)

For a given round `R`, the inflation rewards for that round are made available at the end of round `R+1`.

This provides adequate time for off-chain micropayments to be settled on-chain. This settlement on-chain also provides a [market signal](#market-signals). So, `roundDuration` should be set sufficiently small to provide a good market signal, but sufficiently large to reduce the amount of on-chain transactions required to redeem inflation rewards on an on-going basis.

## Stake Delegation
Participation in the protocol is a specialized activity. In the case of Curators, it entails accurately predicting the future value of datasets to the network, while in the case of Indexing Nodes, it requires operating infrastructure to index and serve data.

Token holders who do not feel equipped to perform one of these functions may *delegate* their tokens to an Indexing Node that is staked for a particular dataset. In this case, the delegator is the residual claimant for their stake, earning participation rewards according to the activities of the delegatee Indexing Node but also forfeiting their stake in the event that the delagatee Indexing Node is slashed.

## Footnotes
- [1] https://multicoin.capital/2018/02/13/new-models-utility-tokens/
- [2] https://medium.com/@simondlr/introducing-curation-markets-trade-popularity-of-memes-information-with-code-70bf6fed9881
- [3] https://medium.com/@petkanics/inflation-and-participation-in-stake-based-token-protocols-1593688612bf
