# Mechanism Design

## Overview
The protocol implements a *work token* token model[[1]](#footnotes) in which indexing node operators stake a deposit of tokens for a specific dataset to participate in a data-retrieval marketplace--indexing data and responding to read requests in exchange for micropayments. This deposit is forfeit in the event that the work is not performed correctly or is performed maliciously, as defined in the [slashing conditions](#dispute-resolution).

There are secondary mechanisms in the protocol that also require a staking of tokens, such as curation, stake delegation, and name registration, all of which will be expanded upon in their respective sections.

## Graph Token
We introduce a native token for the protocol, Graph Tokens, which are the only token that may be used for staking in the network. However, ETH is used for paying for queries, thus reducing friction for end users of dApps that query The Graph. Graph Tokens will have variable inflation to reward specific activities in the network.

## Governance
There are several parameters throughout this mechanism design that are set via a governance process. In the V1 specification, governance will consist of a small committee that enacts changes to the protocol via a multi-sig contract.

## Staking
Indexing nodes deposit a `stakingAmount` of Graph Tokens to process read requests for a specific dataset, as defined by the `subgraphID`.

For a `stakingAmount` to be considered valid, it must meet the following requirements:
 - `stakingAmount >= minStakingAmount` where `minStakingAmount` is set via governance.
 - The `stakingAmount` must be in the set of the top N staking amounts, where N is determined by the `maxIndexers` parameter that is set via governance.

Indexing nodes that have staked for a dataset are not limited by the protocol in how many read requests they may process for that dataset. However, it may be assumed that indexing nodes with higher deposits will receive more read requests and, thus, collect more fees, if all else is equal, as this represents a greater economic security margin to the end user.

## Data Retrieval Market
The work that indexing nodes perform for the network can be described by a function of the type `ReadRequest -> ReadResponse`.

A `ReadRequest` comprises the following parts:
- `readOperation`
- `subgraphID`
- `blockHash`

A `ReadResponse` comprises the following parts:
- `data`
- `attestation`

Additionally, a `ReadRequest` is sent alongside a `lockedBalanceTransfer`. This is a conditional micropayment, which can only be unlocked with a valid `ReadResponse` for the given `ReadRequest`. See [Payment Channels](../payment-channels) for more information.

**TODO** What parameters are sent along with the conditional micropayment?

## Data Retrieval Pricing
Pricing in the data retrieval market is set according to the bandwidth and compute required to process a request.

Compute is priced in `ETH/gas` where the `gas` required for a request is determined by the specific read operation and parameters. See [Read Interface](https://github.com/graphprotocol/research/tree/zerim/v1-spec-overview/specs/graph-protocol-v1/read-interface).

Bandwidth is priced in `ETH/bytes` where `bytes` refers to the size of the `data` portion of the response, measured in bytes.

Indexing nodes respond with their compute and bandwidth costs on request. See [Query Processing](https://github.com/graphprotocol/research/tree/zerim/v1-spec-overview/specs/graph-protocol-v1/query-processing).

## Verification

### Fisherman
A Fisherman is an economic agent who verifies read responses in exchange for a reward in cases where they detect that an indexing node has attested to an incorrect response, and the Fisherman successfully disputes the response on-chain.

### Dispute Resolution
Dispute resolution is handled through an on-chain dispute resolution process. In future versions of the protocol, this may involve programmatically verifying proofs or using a Truebit-style verification game, but in the V1 specification, the outcome of a dispute will be decided by a centralized arbitrator interacting with the on-chain dispute resolution process.

To dispute a response, a Fisherman must submit the attestation of the response they are disputing as well as a deposit equal to that of the indexing node who produced the response.

In the event of a successful dispute, the indexing node forfeits the entire deposit of tokens they staked on the dataset for which they produced an incorrect response. The Fisherman, in turn, receives a reward equal to 50% of the slashed deposit.

In the event of an unsuccessful dispute, the Fisherman forfeits the entire deposit they submitted with their dispute.

## Market Discovery

### Market Signals
Market discovery is the process by which indexing nodes choose which datasets to index and serve data on.

When the data retrieval market for a particular dataset is active, an indexing node may observe payment activity on-chain to decide if it would be profitable to participate in that market.

**TODO** How often should micropayment channels be settled so that the signal to the network is adequate?

With little to no activity for a newly created dataset, however, payment activity provides a poor signal. Instead, this signal to the network is provided by a *Curation Market*.[[2]](#footnotes)

### Curation Market
Curators are economic agents who earn rewards by betting on the future economic value of datasets, perhaps with the benefit of private information.

A Curator stakes a deposit of Graph Tokens for a particular dataset in exchange for dataset-specific *subgraph tokens*. These tokens entitle the holder to a portion of a curation reward, which is paid in Graph Tokens through inflation. See [inflation rewards](#inflation-rewards) for how curation reward is calculated for each dataset.

Subgraph tokens are issued according to a bonding curve, making it more expensive to mint subgraph tokens by locking up ETH over time and, thus, more expensive to purchase a share of future curator inflation rewards over time.

**TODO** [Define bonding curve for curation market or bonding curve parameters](https://github.com/graphprotocol/research/issues/69).

## Inflation Rewards
The total monetary inflation rate of Graph Tokens over a given inflation period is the sum of its two constituent components:

`inflationRate = curatorRewardRate + participationRewardRate`

As indicated in the formula above, inflation is used to reward curation of datasets and participation in the network.

### Participation-Adjusted Inflation
To encourage Graph Token holders to participate in the network, the protocol implements a participation-adjusted inflation[[3]](#footnotes) reward.

The participation reward to the entire network is calculated as a function of a `targetParticipationRate` that is set via governance. If `actualParticipationRate == targetParticipationRate`, then `participationRewardRate = 0`. Conversely, the lower the actual participation rate is relative to the target participation rate, the higher the participation reward.

**TODO** [Decide on actual function for relating `participationRewardRate` to `targetParticipationRate`](https://github.com/graphprotocol/research/issues/70).

To incentivize actual work being provided to the network, not just staking, the participation reward will be distributed to indexing nodes who are staking for datasets with the most economic activity.

Let `participationReward[s[i]]` be the participation reward allotted to indexing node `i` staked on dataset `s`. Let `transactionVolume[s[i]]` be the economic value of all data retrieval fees paid to indexing node `i` for data from dataset `s` over a given inflation period, and `totalTransactionVolume` be the total transaction volume for the entire network over the same period, both measured in ETH. Then, we can define the participation reward as:

`participationReward[s[i]] = (transactionVolume[s[i]] / totalTransactionVolume) * participationRewardRate * totalTokenSupply`

**TODO** How to deter indexing nodes from faking data retrieval transactions to claim a greater portion of the participation reward?

### Curator Inflation Reward
The `curationRewardRate` is defined as a percentage of the total Graph Token supply and is set via governance. As with the participation reward, it is paid via inflation.

Let `grossTransactionValue[s]` be the total value of all transactions in the data-retrieval market for a dataset `s` over a given inflation period. We can define `curationReward[s]`, the total curation reward shared by all Curators of a dataset `s` over a given inflation period:

`curatorReward[s] = (grossTransactionValue[s] / totalTransactionValue) * curationRewardRate * totalTokenSupply`

The share of this dataset-specific curation reward that an individual Curator receives is determined according to the share of the curator reward they acquired in the [curation market](#curation-market).

### Inflation Periods
Inflation rewards are calculated over a period of time, measured in blocks, according to a `roundDuration` parameter that is set via governance.

For a given round `R`, the inflation rewards for that round are made available at the end of round `R+1`.

This provides adequate time for off-chain micropayments to be settled on-chain. This settlement on-chain also provides a [market signal](#market-signals). So, `roundDuration` should be set sufficiently small to provide a good market signal, but sufficiently large to reduce the amount of on-chain transactions required to redeem inflation rewards on an on-going basis.

## Stake Delegation
Participation in the protocol is a specialized activity. In the case of Curators, it entails accurately predicting the future value of datasets to the network, while in the case of indexing nodes, it requires operating infrastructure to index and serve data.

Token holders who do not feel equipped to perform one of these functions may *delegate* their tokens to an indexing node that is staked for a particular dataset. In this case, the delegator is the residual claimant for their stake, earning participation rewards according to the activities of the delegatee indexing node but also forfeiting their stake in the event that the delagatee indexing node is slashed.

## Footnotes
- [1] https://multicoin.capital/2018/02/13/new-models-utility-tokens/
- [2] https://medium.com/@simondlr/introducing-curation-markets-trade-popularity-of-memes-information-with-code-70bf6fed9881
- [3] https://medium.com/@petkanics/inflation-and-participation-in-stake-based-token-protocols-1593688612bf
