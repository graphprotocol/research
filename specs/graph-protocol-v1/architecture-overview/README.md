# Architecture Overview

## High Level Architecture

```
    +------------------------------------------------------------------+
    |                                                                  |
    | Decentralized Application                                        |
    |                                                                  |
    +-+---------------------------------^--------------------------+---+
      |                                 |                          |
      |                              Queries                       |
      |                                 |                          |
      |   +-----------------------------+--------------------+     |
      |   |                                                  |     |
      |   |  Query Nodes & Clients                           | Micropayments
      |   |                                                  |     |
      |   +---------+-------------------^--------------------+     |
      |             |                   |                          |
Transactions   Attestations     (Reads, Attestations)              |
      |             |                   |                          |
      |   +---------v-----------+  +----+--------------------------v---+
      |   |                     |  |                                   |
      |   |  Fisherman Service  |  | Indexing Nodes                    |
      |   |                     |  |                                   |
      |   +---------+-----------+  +----^-------------------^----------+
      |             |                   |                   |
      |         Disputes          (Events, Data)          Data
      |             |                   |                   |
    +-v-------------v-------------------+-----+ +-----------+----------+
    |                                         | |                      |
    |                Ethereum                 | |   IPFS               |
    |                                         | |                      |
    +-----------------------------------------+ +----------------------+
```

## Overview
The Graph supports a CQRS pattern where dApps send commands (transactions) to the underlying Ethereum blockchain, but issue queries (reads) against the layer 2 Indexing Nodes, in exchange for micropayments, via a Query Node or Query Client. In addition to being able to scale reads independently from transactions, there is the added benefit of being able to specify read semantics which differ from the more limited write semantics supported by the Ethereum blockchain (see Data Modeling). Indeed it allows the dApp to query a completely different view on the underlying blockchain data, which may be augmented by data that is stored off-chain on IPFS. Read responses are accompanied by *attestations* which a Query Node may optionally provide to a Fisherman Service to provide economic guarantees as the correctness of responses (see Mechanism Design).

**Note:** While the above diagram conveys the full architecture of a dApp interacting with The Graph, the protocol is primarily concerned with the interface to the Indexing Nodes, as well as as the mechanisms implemented by a series of smart contracts which shall be deployed to the Ethereum mainnet. Query Nodes, Query Clients, and Fisherman Services are "extra-protocol", which is to say that while they may be described in this document to add color, the protocol is agnostic to their specific interfaces and logic, and indeed we expect there to arise multiple implementations with distinct interfaces and logic. There may also arise multiple implementations for the Indexing Nodes, in a variety of languages, however, the service interfaces of each implementation must adhere strictly to the protocol.

## Components

### Decentralized Application (dApp)
This is an application run by an end user in their browser or on their device. Its data and business logic primarily lives on the Ethereum Blockchain and IPFS, meaning that it is robust to censorship and economic risks of the developers shutting down or going out of business. In exchange for this robustness, a user assumes the cost of operating the infrastructure required to power the dApp, by paying gas costs to transact against the Ethereum blockchain, and making micropayments for metered usage of The Graph in order to query the data required to power the dApp. The dApp may interact with The Graph via an embedded Query Client or via an external Query Node.

### Query [Nodes | Clients]
Query Nodes provide an abstraction on top of the low-level read API provided by the Indexing Nodes. The Query Nodes may optionally choose to provide a GraphQL interface, a SQL interface or a traditional REST interface - whatever is best suited towards the respective domain in which it will be used. We will provide a reference Javascript Query Node which provides a GraphQL interface and may be embedded and extended in a server or browser application as a Query Client.

In addition to providing an interface to dApps the Query Node is responsible for discovering Indexing Nodes in the network which are indexing a specific data set, and selecting an Indexing Node to read from based on factors such as price and performance (the specific logic is left to the implementor). It may also optionally forward attestations along to a Fisherman Service.

### Indexing Nodes
Indexing Nodes index one or more user-defined datasets. Indexing Nodes perform a deterministic streaming extract, transform, load (ETL) of events emitted by the Ethereum blockchain. These events are event-sourced according to user-defined "mappings," which may also load additional data from the Ethereum blockchain or IPFS (see Dataset Creation).

**Note:** Here, and throughout this document, "event" is used in its standard usage, as it is used in the term "event-sourcing", and meaning data which is emitted asynchronously and may act as a trigger for computation. This is to disambiguate from "Solidity events," which build atop Ethereum's low-level logging facilities, and will be referred to throughout this specification as "Solidity events" or simply "logs." Indexing Nodes will process events which include logs, new blocks, as well as internal and external Ethereum transactions.

Indexing Nodes implement a standard interface for reading from indexes, as for advertising compute and bandwidth prices for read operations (see Query Market).

## Fisherman Service
Fisherman Services accept read responses and attestations which they may verify, and in the event of an invalid response, may file a dispute. This will be covered in-depth in the Mechanism Design. Note that whether or not the Fisherman Service actually verifies the response is completely opaque to the end-user and the protocol.

### IPFS
"IPFS" refers to the Interplanetary File Service, a decentralized content-addressed storage network. Data stored on IPFS is identified by a canonicalized hash [[1]](#footnotes). It has become a common pattern to store these hashes in Ethereum contracts, providing a form of cheap off-chain storage.

### Ethereum
Ethereum is a blockchain which can run small Turing-complete executable programs called smart contracts. Consensus is built around the results of these computations, meaning that a centralized actor cannot easily tamper with or rewrite the results of past computations [[2]](#footnotes).

The Ethereum blockchain plays two principle roles in the protocol: First, dApps include business logic implemented as smart contracts deployed to the Ethereum blockchain, which in turn emit events and store data which is indexed by The Graph. Second, the mechanisms which define the incentives and economic security of The Graph are themselves implemented as smart contracts deployed to the Ethereum blockchain.

## Footnotes
- [1] https://ipfs.io/ipfs/QmR7GSQM93Cx5eAg6a6yRzNde1FQv7uL6X1o4k7zrJa3LX/ipfs.draft3.pdf
- [2] https://github.com/ethereum/wiki/wiki/White-Paper#bitcoin-as-a-state-transition-system
