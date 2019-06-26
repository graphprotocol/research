# Architecture Overview

## High-Level Architecture

```ascii
    +------------------------------------------------------------------+
    |                                                                  |
    | Decentralized Application (dApp)                                 |
    |                                                                  |
    +-+---------------------------------^--------------------------+---+
      |                                 |                          |
      |                              Queries                       |
      |                                 |                          |
      |   +-----------------------------+--------------------+     |
      |   |                                                  |     |
      |   |  Query Nodes and Clients                         | Micropayments
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
The Graph supports a command query responsibility segregation (CQRS) pattern where dApps send commands (transactions) directly to the underlying Ethereum blockchain, but issue queries (reads) against the layer 2 Indexing Nodes, in exchange for micropayments, via a Query Node or Query Client. In addition to being able to scale reads independently from transactions, there is the added benefit of being able to specify read semantics which differ from the more limited write semantics supported by the Ethereum blockchain (see [Data Modeling](../data-modeling)). Indeed it allows the dApp to query a completely different view on the underlying blockchain data, which may be augmented by data that is stored off-chain on IPFS. Read responses are accompanied by [attestations](../messages#attestation), messages which certify the correctness of a response, which a Query Node may optionally provide to a Fisherman Service to improve the economic security guarantees as to the correctness of responses in the network (see [Mechanism Design](../mechanism-design)).

**Note:** While the above diagram conveys the full architecture of a dApp interacting with The Graph, the protocol is primarily concerned with the interface to the Indexing Nodes, as well as as the mechanisms implemented by a series of smart contracts which shall be deployed to the Ethereum mainnet. Query Nodes, Query Clients, and Fisherman Services are "extra-protocol", which is to say that while they may be described in this document to add color, the protocol is agnostic to their specific interfaces and logic, and indeed we expect there to arise multiple implementations with distinct interfaces and logic. There may also arise multiple implementations for the Indexing Nodes, in a variety of languages, however, the service interfaces of each implementation must adhere strictly to the protocol defined in this specification.

## Components

### Decentralized Application (dApp)
This is an application run by an end user in their browser or on their device. Its data and business logic primarily live on the Ethereum blockchain and IPFS, meaning that it is safe from censorship and the economic risks of the developers shutting down or going out of business. In exchange for this robustness, a user assumes the cost of operating the infrastructure required to power the dApp by paying gas costs to transact against the Ethereum blockchain and making micropayments for metered usage of The Graph to query the data required to power the dApp. The dApp may interact with The Graph via an embedded Query Client or external Query Node.

### Query [Nodes | Clients]
Query Nodes provide an abstraction on top of the low-level read API provided by the Indexing Nodes. The Query Nodes may optionally choose to provide a GraphQL interface, SQL interface, or traditional REST interface, whatever is best-suited toward the respective domain in which it will be used. We include a reference JavaScript Query Node that provides a GraphQL interface and may be embedded and extended in a server or browser application as a Query Client.

In addition to providing an interface to dApps, the Query Node is responsible for discovering Indexing Nodes in the network that are indexing a specific dataset, and selecting an Indexing Node to read from based on factors such as price and performance (see [Query Processing](../query-processing)). It may also optionally forward attestations along to a Fisherman Service.

### Indexing Nodes
Indexing Nodes index one or more user-defined datasets, called *subgraphs*. These nodes perform a deterministic streaming extract, transform and load (ETL) of events emitted by the Ethereum blockchain. These events are processed by user-defined logic called *mappings* which run deterministically inside a WASM runtime, and are also able to load additional data from the Ethereum blockchain or IPFS, in order to compute the current state of a subgraph. See [Datasets](../datasets)) for more information.

**Note:** Here, and throughout this document, "event" is used in its standard usage, meaning data which is emitted asynchronously and may act as a trigger for computation. This is to disambiguate from "Solidity events," which build atop Ethereum's low-level logging facilities, and will be referred to throughout this specification as "Solidity events" or "Ethereum logs". Indexing Nodes will process events which include Ethereum logs, new blocks, as well as internal and external Ethereum transactions.

Indexing Nodes implement a standard interface for reading from indexes and to advertise compute and bandwidth prices for read operations. See [JSON-RPC API](../rpc-api)) for full interface.

## Fisherman Service
Fisherman Services accept read responses and attestations which they may verify, and in the event of an invalid response, may file a protocol-level dispute (see [Mechanism Design](../mechanism-design)). Note that whether or not the Fisherman Service actually verifies the response is completely opaque to the end-user and the protocol.

In the v1 of the protocol, the Graph Protocol team will operate a Fisherman service.

### IPFS
"IPFS" refers to the Interplanetary File Service, a decentralized content-addressed storage network. Data stored on IPFS is identified by a content ID (CID) which is computed by encoding and hashing the content being stored.[<sup>1</sup>](#footnotes) It has become a common pattern to store these CIDs in Ethereum contracts, providing a form of cheap, decentralized, off-chain storage. The Graph will index data linked in IPFS, referenced in Ethereum smart contracts, to support this use case.

The Graph also uses IPFS in this way - subgraph manifests, are stored on IPFS and referenced on-chain in the protocol's smart contracts (see [Subgraph Manifest](../subgraph-manifest)). In the future, we may store indexed data and even query results on IPFS, as having data stored in a global decentralized file system increases chances for reuse, adds redundancy for widely used data and effectively gives you caching for free.

### Ethereum
Ethereum is a blockchain that can run small Turing-complete executable programs called smart contracts. Consensus is built around the results of these computations, using a Byzantine fault tolerant (BFT) consensus algorithm, meaning that a centralized actor cannot easily tamper with or rewrite the results of past computations.[<sup>2</sup>](#footnotes)

The Ethereum blockchain plays two principle roles in the protocol. First, dApps include business logic implemented as smart contracts deployed to the Ethereum blockchain, which in turn emit events and store data that is indexed by The Graph. Second, the mechanisms that define the incentives and economic security of The Graph are themselves implemented as smart contracts deployed to the Ethereum blockchain.

## Footnotes
- [1] https://ipfs.io/ipfs/QmR7GSQM93Cx5eAg6a6yRzNde1FQv7uL6X1o4k7zrJa3LX/ipfs.draft3.pdf
- [2] https://github.com/ethereum/wiki/wiki/White-Paper
