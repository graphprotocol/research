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

The types listed below are inclusive of all the data types that get passed through messaging in the protocol, and mvariables that can be called within the protocol

Network Data types 
- total staked
- total tokens
- index chain set 
    - validator set (of each index chain)


Block Data Types
- round
- block 
- block reward

Validator Data Types
- validator address
- bonded amount
- round started
- last time claimed
- fees or reward cut (can a validator charge different fees? a lot more variables can go in here)

Where parameters are adjustable live protocol variables

List of Parameters 

These can be enforceable high level, or else by decentralized governance 
- round length
- thawing period
- unbonding period
- minimum number of validators
- maximum number of validators 
- inflation rate
- target bondind rate 


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


### Slashing Message
- fraud proof
    - quer(ies) in question
    - block of false query
    - block on mainnet of real one 
    - the validator in  question
- what about fraud proof for a whole chain
    - much more here 


---

## Stakeholders

Anyone dealing with **bonded stake**

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


---

## Staking

__Create action diagram__  changeBond(), and leaveValidator (2 diagramsRewar

__Each of them are a message interface.__

__Explain how the messages connect to mainnet__

__Actors are to be incentivzed to do all messages__


The Index Chains watch for events emitted from the Ethereum network to become informed when a change to the Validator set occurs. Events are the best solution to use, since they are Ethereum's main way of comunicating with the outside world. The event emitted will give the Index Chain the information it needs to allow a new Validator to join the Index Chain. The event data is as secure and reliable as the Ethereum main chain. 

This process will be described below in three different ways - bonding, rewards, and slashing. These are the ways that the Index chains interact with the Ethereum main chain. 







### Bonding

![Bonding Message Diagram](./registerValidator_msg.jpeg)

A user with Graph Tokens finds an Index Chain they would like to validate on. Then they do Step 1:

1. Once they confirm they meet the requirements to stake, they call the mainnet staking contract function registerValidator(), They pass data that indicates which Index Chain they will Validate on. This includes the Index Chain ID, their Validator ID, and the amount of Graph Tokens to stake. Once the becomeValidator() transaction is included in the main chain, it will emit an event :

        Event New Validator(
        Index Chain ID, 
        Graph Network Node ID, 
        Main Chain Account Address, 
        Graph Tokens Staked 
        )

The Index Chain is listening for the mainnet staking smart contract for the NewValidator event with it’s own IndexChainID. The event will get added into a new block on the Index Chain, and it will update the Validator Set. The Index Chain Node ID allows the new Index Chain Node to become a Validator. Then Step 2:

2. The new Validator runs a CLI command in The Graph Network software and it would create you as a validator if after a check (small bond to prevent spam))

### Unbonding

__Create message interface__

### Rebonding 

While bonding and unbonding, both 
__Create message interface__


---

## Rewards

Note - fees are being left out for now

__Create action diagram__ - mintInflationTokens() (called daily), claimRewards() (probably 1 diagram, claimRewards() hasnt been made ), then also there needs to be a way to measure the query count , and that needs to be done in the payout claculation

Explain how the messages connect to mainnet

Actors are to be incentivzed to do all messages



### Creation of Rewards

Create message interface

### Pool of Shares

Show the formula, not the example

Explain the Pool itself


### Claiming of Rewards and Distribution

Automatically and manually
Create message interface


### Inflation

Inflation adjustment? 

Create message interface



---

## Slashing

Note - final slashing parameters not decided. May be adjustable. 
Note - don't get into the dispute process 

__Create action diagram__  - liveness faults doesnt need one. doubleSignFault() needs to be shown (1 diagram)

Explain how the messages connect to mainnet

Actors are to be incentivzed to do all messages


### Incentivization

You are incentivized by the reward of what gets slashed. 


### Fraud Proofs

Fishermen submit these 

How do they submit them? 

Create message interface


