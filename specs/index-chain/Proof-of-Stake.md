# Graph Network Proof-of-Stake (POS) Technical Specification

## Table of Contents

* [Introduction](#introduction)
* [Types and Parameters](#types-and-parameters)
* [Stakeholders](#stakeholders)
* [POS Smart Contracts](#pos-smart-contracts)
* [Staking](#staking)
* [Rewards](#rewards)
* [Slashing](#slashing)

---

## Introduction

Note - this spec is sectioned off right now. It does not have basic introductions of The Graph, and the stakeholders, because that would be in the intro of the whole specification

The Graph Network uses Proof of Stake (POS) to achieve economic finality by incentivizing the group of distributed nodes to come to consensus on Index Chain data. Proof of Stake is an incentivization protocol on top of a blockchain. Stakeholders can vote, proportional to their stake they have in the network. In the Graph Network the staking is done with The Graph Token, and the nodes which are staking are called **Validators**

Each Index Chain has its own set of Validators. When a user owns Graph Tokens, they can stake them on the Ethereum Mainnet, and become a Validator of an Index Chain of their choosing. The Graph Network Staking Contracts emit events, and these events are the messaging interface at which Index Chains are able to add new Validators. 

Validators are rewarded for producing correct blocks, and punished for misbehaviour. An Index Chain’s block rewards are proportional to how often it is queried, which is determined in the Query Marketplace.

There are three ways to interact with the POS protocol. They are staking, rewards, and slashing. The spec will be described with these three ways in mind. 

TODO: explain the relationship between index chains and subgraphs. 

---

## Types and Parameters and Message Formats

The types listed below are inclusive of all the data types that get passed through messaging in the protocol, and variables that can be called within the protocol

TODO: Link every mention of these back up to this list 

| Network Data Types              | Type    | Description                                                                                                                                     |
| ------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------|
| Total Staked                    | uint256 | The total amount of Graph Tokens staked within the network.                                                                                     |
| Total Tokens                    | uint256 | The total amount of Graph Tokens that exist within the network.                                                                                 |
| Index Chain List                | mapping | The list of all Index Chains that are currently staked within the network.                                                                      |
| Validator Set                   | mapping | The Validator set of each Index Chain. There is a Validator set for each Index chain                                                            |

| Block Data Types                | Type    | Description                                                                                                                                     |
| ------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------|
| Block Number (Mainnet)          | uint256 | Indicates the block number of the blockchain the POS smart contract is on.                                                                      |
| Block Number Index Chain        | uint256 | Indicates the block number of the Index Chain.                                                                                                  |
| Block Reward                    | uint256 | The total number of tokens rewarded per a mainnet block.                                                                                        |

| Validator Data Types            | Type    | Description                                                                                                                                     |
| ------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------|
| Validator Address (Mainnet)     | address | The address of the mainnet account that has staked Graph Tokens.                                                                                |
| Validator ID (Index Chain)      | Bytes   | The Validator ID, which is produced by The Graph Network client, and used to connect to an Index chain.                                         |
| Bonded Amount                   | uint256 | The amount of Graph Tokens a Validator has staked.                                                                                              |
| Started Validating              | uint256 | The block number (mainnet) that the Validator began Validating.                                                                                 |

Parameters can be set at the protocol level to fine tune how the POS protocol functions. At first they will be controlled by a multisig address, and eventually they will be adjusted by governance. 

| Parameters                      | Type    | Description                                                                                                                                     |
| ------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------|
| Thawing Period                  | uint256 | The period of time (unix) that tokens must be frozen before withdrawal. Must be used to prevent long-range attacks.                             |
| Minimum number of Validators    | uint256 | The minimum number of Validators required for an Index Chain to be part of the network.                                                         |
| Maximum Number of Validators    | uint256 | The maximum number of Validators an Index Chain is allowed to have.                                                                             |
| Maximum Number of Index Chains  | uint256 | The maximum number of Index Chains allowed to connect to the POS Smart contract. Must be limited do to technological constraints.               |
| Target Bonded Ratio             | uint256 | The ratio that is desired to stabilize the network. Max and Min Inflation Rate are used to hone in on the TBR.                                  |
| Maximum Inflation Rate          | uint256 | The maximum the protocol will allow tokens to be inflated (yearly).                                                                             |
| Minimum Inflation Rate          | uint256 | The minimum the protocol will allow tokens to be inflated (yearly).                                                                             |

### Staking messages 

A `becomeValidator()` message consists of the following parameters:

| Parameter                       | Type    | Description                                                                                                                                     |
| ------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Bond Amount                     | uint256 | The amount of Graph Tokens being staked. Must be large enough to put the new Validator in the top Validator set.                                |
| Validator Address               | address | The address that the validator is using for the smart contract platform (i.e. Ethereum).                                                        |
| Validator ID                    | uint256 | Each Validator has a unique ID they get from the Index Chain. The Validator must share this with the smart contract.                            |
| Index Chain ID                  | address | The Index Chain ID is unique to each Index Chain. This allows the smart contract to create a list of each Index Chain.                          |

A `stopValidating()` message consists of the following parameters:

| Parameter                       | Type    | Description                                                                                                                                     |
| ------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Validator Address               | address | The address that the validator is using for the smart contract platform (i.e. Ethereum).                                                        |
| Validator ID                    | uint256 | Each Validator has a unique ID they get from the Index Chain. The Validator must share this with the smart contract.                            |
| Index Chain ID                  | address | The Index Chain ID is unique to each Index Chain. This allows the smart contract to create a list of each Index Chain.                          |

A `changeStake()` message consists of the following parameters:

| Parameter                       | Type    | Description                                                                                                                                     |
| ------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Change Amount                   | uint256 | The amount of Graph Tokens being added or subtracted.                                                                                           |
| Increase Stake                  | boolean | True if increasing the stake, false if lowering the stake.                                                                                      |
| Validator Address               | address | The address that the validator is using for the smart contract platform (i.e. Ethereum).                                                        |
| Validator ID                    | uint256 | Each Validator has a unique ID they get from the Index Chain. The Validator must share this with the smart contract.                            |
| Index Chain ID                  | address | The Index Chain ID is unique to each Index Chain. This allows the smart contract to create a list of each Index Chain.                          |


### Rewards Messages

TODO

### Slashing Message

TODO
- fraud proof
    - quer(ies) in question
    - block of false query
    - block on mainnet of real one 
    - the validator in  question
- what about fraud proof for a whole chain
    - much more here 


---

## Stakeholders

Anyone dealing with **bonded stake** within the network. They are: 

- **Validators**: Users that bond tokens and serve up queries in exchange for shared rewards and fees.
- **Fishermen**: Submit slash proofs as on-chain evidence of false queries, for which they are rewarded a fee.

---

## POS Smart Contracts 

The mainnet staking smart contract is the interface between the Ethereum mainnet Graph Tokens, and the network of Index Chains.

The staking smart contract stores all Index Chain information, as well each chains Validator set. The **Current Validator Set** stored on an Index Chain directly maps to the staked accounts on the mainnet staking smart contract.

The staking smart contract is designed to punish bad behaviour by slashing, and to reward good behaviour with inflationary block rewards. It is also designed to incentivize all rational actors to be rewarded to make function calls whenever necessary. This is done for simplicity. 



### Connecting Multiple POS Index Chains

The diagram below shows how the staking smart contract is the connection point for all Index Chains.

![POS Architecture](./POS_Architecture.jpeg)

The smart contract will map the the follow data structures:

SubgraphID     --> Index Chain IDs

Index Chain ID --> Validator Set
 
Validator      --> Stake 

Each SubgraphID has a list of the Index Chains within it. Each of those chains has a Validator set, representing the nodes securing the network. Each Validator has a stake they have posted. This design allows for an organized way to see how much is at stake, per Validator, and per Index Chain. 

### Round Progression

- the blockhash of each round will be stored (note, we will find a way to make this less work intensive)
NOTE: most of this should be left to the consensus section 


---

## Staking

The Index Chains watch for events emitted from the Ethereum network to become informed when a change to the Validator set occurs. Events are the best solution to use, since they are Ethereum's main way of comunicating with the outside world. The event emitted will give the Index Chain the information it needs to allow a new Validator to join the Index Chain. The event data is as secure and reliable as the Ethereum main chain. 

This process will be described below in three different ways - bonding, rewards, and slashing. These are the ways that the Index chains interact with the Ethereum main chain. 

### Bonding to Become a Validator

![Bonding Message Diagram](./registerValidator_msg.jpeg)

A user with Graph Tokens finds an Index Chain they would like to validate on. Then they do Step 1:

1. Once they confirm they meet the requirements to stake, they call the mainnet staking contract function registerValidator(), They pass data that indicates which Index Chain they will Validate on. This includes the Index Chain ID, their Validator ID, and the amount of Graph Tokens to stake. Once the becomeValidator() transaction is included in the main chain, it will emit an event :

        Event New Validator(
            Index Chain ID, 
            Graph Network Node ID, 
            Main Chain Account Address (msg.sender), 
            Graph Tokens Staked 
        )

The Index Chain is listening for the mainnet staking smart contract for the NewValidator event with it’s own IndexChainID. The event will get added into a new block on the Index Chain, and it will update the Validator Set. The Index Chain Node ID allows the new Index Chain Node to become a Validator. Then Step 2:

2. The new Validator runs a CLI command in The Graph Network software and it would create you as a validator if after a check (small bond to prevent spam))

### Unbonding to Stop Validating 

![Unbonding Message Diagram](./Unbonding_msg.jpeg)

A Validator can stop validating with one call to the POS smart contract:

1. The Validator calls `stopValidating()` with their Validator ID, and Index Chain ID. Next the Event Stop Validating will be emitted: 

        Event Stop Validating(
            Index Chain ID, 
            Validator ID, 
            Main Chain Account Address (msg.sender), 
        )

The Index Chain Validators are listening for such events, and every Validator will then include an update to the Validator set in the next block. When a majority consensus is reached, the Validator set will be updated, and the Validator will no longer participate in consensus, and their tokens will enter the thawing period. 

### Rebonding Frozen Tokens

When a Validator unbonds tokens, they get put through a thawing period, which could be weeks or months long, depending on how the parameter is set. A delegator is free to rebond tokens that are frozen, with no wait time. This could happen from voluntary unbonding, or from being unbonded due to liveness faults. TODO: (LINK TO LOCATION OF SPEC)

### Changing Stake 

A Validator may want to increase or decrease their stake on their node. This is done by calling `changeStake()` on the POS smart contract. If they are adding stake, it will be added as soon as it can be included in a block. If they are lowering their stake, the tokens must go through the thawing period before they can be released from the POS smart contract. 

---

## Rewards

Note - fees are being left out for now
NOTE - mention of how getting rewarded with queries is left out of detail here for now, as this section focuses more on the messaging between 


__Create action diagram__ - mintInflationTokens() (called daily), claimRewards() (probably 1 diagram, claimRewards() hasnt been made ), then also there needs to be a way to measure the query count , and that needs to be done in the payout claculation

Block rewards are created in order for Validators to receive compensation. This happens on the Ethereum mainnet. With The Graph Network, there needs to be a simple way to pass down the rewards to each Index Chain, and then within each Index Chain, each Validator needs to be rewarded their appropriate amount. 

The minimum and maximum Inflation pecentage is set at the parameter level, first by a multisig controlling account, and eventually by governance voting. The **Current Inflation Rate** will be continuously adjusted, as it aims to match the **Target Bonded Ratio**.

### Pool of Shares TODO


Show the formula, not the example

Explain the Pool itself

The **Pool** is a data structure created to help with efficient distribution of rewards to each Index Chain, and each Validator. 

### Minting Graph Tokens for Rewards TODO


__Create message interface__

TODO


### Claiming of Rewards and Distribution TODO


Automatically and manually
__Create message interface__



---

## Slashing TODO


Note - final slashing parameters not decided. May be adjustable. 
Note - don't get into the dispute process 

__Create action diagram__  - liveness faults doesnt need one. doubleSignFault() needs to be shown (1 diagram)

Explain how the messages connect to mainnet

Actors are to be incentivzed to do all messages

### Fraud Proofs TODO


Fishermen submit these 

How do they submit them? 

Create message interface


