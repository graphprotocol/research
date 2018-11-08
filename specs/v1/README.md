# Graph Protocol Specification

**Version**: 0.0.1

**Stage**:
![WIP Badge](https://img.shields.io/badge/stage-wip-%23C25F38.svg)

**Authors**:
 - [Brandon Ramirez](github.com/zerim)

## Abstract
This document presents *Graph Protocol* ("the protocol"), a protocol for indexing public blockchain data and querying this data via a decentralized network. The canonical network implementing the protocol is referred to as *The Graph* ("the network").

Graph Protocol falls into a category we refer to as *layer 2 read-scalability* solution. It's purpose is to enable decentralized applications (dApps) to query public blockchain data, efficiently and trustlessly, via a service which, like blockchains and the Internet itself, operates as a public utility. This is in the interest of minimizing the role of brittle centralized infrastructure seen in many "decentralized" application architectures today.

This specification covers the network architecture, protocol interfaces, algorithms and economic incentives required to build a network that is robust, performant, cost efficient, and enables a high margin of economic security for queries processed via the network.

## Table of Contents

1. Architecture Overview
1. Mechanism Design
1. Dataset Creation
  1. Data Modeling
  1. [Subgraph Manifest](./subgraph-manifest)
  1. Mappings API
1. Dataset Curation
1. Indexing
1. Query Processing
1. Verification and Disputes
