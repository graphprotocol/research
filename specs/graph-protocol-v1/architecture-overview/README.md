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
The Graph supports a CQRS pattern where dApps send commands (transactions) to the underlying Ethereum blockchain but issues queries (reads) against the layer 2 Indexing Nodes, in exchange for micropayments, via a Query Node or Query Client. In addition to being able to scale the reads independently from the transactions, there is the added benefit of being able to specify read semantics that differ from the more limited write semantics supported by the Ethereum blockchain. See [Data Modeling](https://github.com/graphprotocol/research/tree/zerim/v1-spec-overview/specs/graph-protocol-v1/data-modeling) for more information. It allows the dApp to query a completely different view of the underlying blockchain data, which may be augmented by data that is stored off-chain on IPFS. Read responses are accompanied by *attestations* that a Query Node may optionally pass to a Fisherman Service to provide economic guarantees as to the correctness of responses. See [Mechanism Design](https://github.com/graphprotocol/research/tree/zerim/v1-spec-overview/specs/graph-protocol-v1/mechanism-design) for more information.

**Note:** While the above diagram conveys the full architecture of a dApp interacting with The Graph, the protocol is primarily concerned with the interface to the Indexing Nodes as well as the mechanisms implemented by a series of smart contracts, which shall be deployed to the Ethereum mainnet. Query Nodes, Query Clients, and Fisherman Services are "extra-protocol," which is to say that while they may be described in this document to add color, the protocol is agnostic to their specific interfaces and logic. We expect multiple implementations with distinct interfaces and logic. There may also be multiple implementations for the Indexing Nodes in a variety of languages. However, the service interfaces of each implementation must adhere strictly to the protocol.

## Components

### Decentralized Application (dApp)
This is an application run by an end user in their browser or on their device. Its data and business logic primarily live on the Ethereum blockchain and IPFS, meaning that it is safe from censorship and the economic risks of the developers shutting down or going out of business. In exchange for this robustness, a user assumes the cost of operating the infrastructure required to power the dApp by paying gas costs to transact against the Ethereum blockchain and making micropayments for metered usage of The Graph to query the data required to power the dApp. The dApp may interact with The Graph via an embedded Query Client or external Query Node.

### Query [Nodes | Clients]
Query Nodes provide an abstraction on top of the low-level read API provided by the Indexing Nodes. The Query Nodes may optionally choose to provide a GraphQL interface, SQL interface, or traditional REST interface, whatever is best suited toward the respective domain in which it will be used. We will provide a reference JavaScript Query Node that provides a GraphQL interface and may be embedded and extended in a server or browser application as a Query Client.

In addition to providing an interface to dApps, the Query Node is responsible for discovering Indexing Nodes in the network that are indexing a specific dataset and selecting an Indexing Node to read from based on factors such as price and performance. The specific logic is left to the implementor. It may also optionally forward attestations along to a Fisherman Service.

### Indexing Nodes
Indexing Nodes index one or more user-defined datasets. These nodes perform a deterministic streaming extract, transform, and load (ETL) of the events emitted by the Ethereum blockchain. These events are event-sourced according to user-defined "mappings," which may also load additional data from the Ethereum blockchain or IPFS. See [Dataset Creation](https://github.com/graphprotocol/research/tree/zerim/v1-spec-overview/specs/graph-protocol-v1/datasets) for more information.

**Note:** Here, and throughout this document, "event" is used in its standard form as in the term "event-sourcing," meaning data that is emitted asynchronously and may also act as a trigger for computation. This is to disambiguate from "Solidity events," which build on top of Ethereum's low-level logging facilities and will be referred to throughout this specification as "Solidity events" or simply "logs." Indexing Nodes will process events that include logs, new blocks as well as internal and external Ethereum transactions.

Indexing Nodes implement a standard interface for reading from indexes to advertise compute and bandwidth prices for read operations. See [Query Market]() for more information.

**TODO** I'm not sure which link to add for Query Market.

## Fisherman Services
Fisherman Services accept read responses and attestations that they may verify and, in the event of an invalid response, may file a dispute. This will be covered in-depth in the [Mechanism Design](https://github.com/graphprotocol/research/tree/zerim/v1-spec-overview/specs/graph-protocol-v1/mechanism-design). Note that whether or not the Fisherman Service actually verifies the response is completely opaque to the end user and the protocol.

### IPFS
IPFS refers to the Interplanetary File Service, a decentralized content-addressed storage network. Data stored on IPFS is identified by a canonicalized hash [[1]](#footnotes). It has become a common pattern to store these hashes in Ethereum contracts, providing a form of cheap off-chain storage.

### Ethereum
Ethereum is a blockchain that can run small Turing-complete executable programs called smart contracts. Consensus is built around the results of these computations, meaning that a centralized actor cannot easily tamper with or rewrite the results of past computations [[2]](#footnotes).

The Ethereum blockchain plays two principle roles in the protocol. First, dApps include business logic implemented as smart contracts deployed to the Ethereum blockchain, which in turn emit events and store data that is indexed by The Graph. Second, the mechanisms that define the incentives and economic security of The Graph are themselves implemented as smart contracts deployed to the Ethereum blockchain.

## Footnotes
- [1] https://ipfs.io/ipfs/QmR7GSQM93Cx5eAg6a6yRzNde1FQv7uL6X1o4k7zrJa3LX/ipfs.draft3.pdf
- [2] https://github.com/ethereum/wiki/wiki/White-Paper#bitcoin-as-a-state-transition-system
