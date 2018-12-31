# Graph Protocol Specification

**Version**: 0.0.1

**Stage**:
![WIP Badge](https://img.shields.io/badge/stage-wip-%23C25F38.svg)

**Authors**:
 - [Brandon Ramirez](github.com/zerim)

## Abstract
This document presents *Graph Protocol* ("the protocol"), a protocol for indexing public blockchain data and querying this data via a decentralized network. The canonical network implementing the protocol is referred to as *The Graph* ("the network").

Graph Protocol falls into a category we refer to as a *layer 2 read-scalability* solution. Its purpose is to enable decentralized applications (dApps) to query public blockchain data efficiently and trustlessly via a service that, like blockchains and the Internet itself, operates as a public utility. This is in the interest of minimizing the role of brittle, centralized infrastructure seen in many "decentralized" application architectures today.

This specification covers the network architecture, protocol interfaces, algorithms, and economic incentives required to build a network that is robust, performant, cost-efficient, and enables a high margin of economic security for queries processed via the network.

## Philosophy
This spec defines a hybrid network design in which the core mechanisms are decentralized and run on the blockchain, but some building blocks are still centralized. A future version of this specification will target full decentralization. This is in keeping with our team's philosophy of shipping early and delivering immediate value, while incrementally decentralizing, as research and the state of external ecosystem dependencies progress.

See [this slide]() from this [recent research talk](https://www.youtube.com/watch?v=eRnYgXHQnlA&t=586s) for more info on this philosophy.

**TODO** Add link to slide. **THIS STILL NEEDS TO BE DONE.**

## Disclaimer
This spec defines a protocol that is still being implemented. Until a fully stable reference implementation exists, the specification is likely to change in breaking ways.

## Table of Contents

1. [Architecture Overview](./architecture-overview)
2. [Mechanism Design](./mechanism-design)
3. [Payment Channels](./payment-channels)
4. [Datasets](./datasets)
    - [Data Modeling](./data-modeling)
    - [Subgraph Manifest](./subgraph-manifest)
    - [Mappings API](./mappings-api)
5. [Query Processing](./query-processing)
6. [Read Interface](./read-interface)
