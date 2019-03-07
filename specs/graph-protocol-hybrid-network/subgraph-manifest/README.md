# Subgraph Manifest

**TODO** This file has moved to https://github.com/graphprotocol/graph-node. Please confirm. Datasets references this file with ../subgraph-manifest, so it needs to remain in this repo.

## Overview
The Subgraph manifest specifies all the information required to index and query a specific subgraph. It is the entry point to your subgraph, so to speak.

The subgraph manifest, and all the files linked from it, are what is deployed to IPFS, and hashed to produce a subgraph ID that can be referenced on Ethereum and used to retrieve your subgraph in The Graph.

## Format
The subgraph manifest follows the IPLD specification, which defines a data model for linking decentralized and universally addressable data structures.[<sup>1</sup>](#footnotes) Supported formats include YAML and JSON. All examples in this section are written as YAML.

## Top-Level API

| Field  | Type | Description   |
| --- | --- | --- |
| **specVersion** | *String*   | A semver version indicating which version of this API is being used.|
| **schema**   | [*Schema*](#schema) | The GraphQL schema of this subgraph|
| **dataSources**| [*[Data Source Spec]*](#data-source)| Each Data Source spec defines data which will be ingested, and transformation logic to derive the state of the subgraph's entities based on the source data.|

## Schema

| Field | Type | Description |
| --- | --- | --- |
| **file**| [*Path*](#path) | The path of the GraphQL IDL file, either locally or on IPFS |

## Data Source

| Field | Type | Description |
| --- | --- | --- |
| **kind** | *String | The type of data source. Possible values: *ethereum/contract*|
| **name** | *String* | The name of the source data. Will be used to generate APIs in mapping, and also for self-documentation purposes |
| **source** | [*EthereumContractSource*](#ethereumcontractsource) | The source data on a blockchain such as Ethereum |
| **mapping** | [*Mapping*](#mapping) | The transformation logic applied to the data prior to being indexed |

### EthereumContractSource

| Field | Type | Description |
| --- | --- | --- |
| **address** | *String* | The address of the source data in its respective blockchain |
| **abi** | *String* | The name of the ABI for this Ethereum contract (see `abis` in `mapping` manifest) |

### Mapping
The `mapping` field may be one of the following supported mapping manifests:
 - [Ethereum Events Mapping](#ethereum-events-mapping)

#### Ethereum Events Mapping

| Field | Type | Description |
| --- | --- | --- |
| **kind** | *String* | Must be "ethereum/events" for Ethereum Events Mapping |
| **apiVersion** | *String* | Semver string of the version of the Mappings API which will be used by the mapping script |
| **language** | *String* | The language of the runtime for the Mapping API. Possible values: *wasm/assemblyscript* |
| **entities** | *[String]* | A list of entities which will be ingested as part of this mapping. Must correspond to names of entities in the GraphQL IDL |
| **abis** | *ABI* | ABIs for the contract classes which should be generated in the Mapping ABI. Name is also used to reference the ABI elsewhere in the manifest |
| **eventHandlers** | *EventHandler* | Handlers for specific events, which will be defined in the mapping script |
| **file** | [*Path*](#path) | The path of the mapping script |

#### EventHandler

| Field | Type | Description |
| --- | --- | --- |
| **event** | *String* | An identifier for an event which will be handled in the mapping script. For Ethereum contracts, this must be the full event signature to disambiguate from events which may share the same name. |
| **handler** | *String* | The name of an exported function in the mapping script which should handle the specified event. |

## Path
A path has one field `path` which either refers to a path of a file on the local dev machine, or an [IPLD link](#footnotes).

When using the Graph-CLI, local paths may be used during development, and then the tool will take care of deploying linked files to IPFS and replacing the local paths with IPLD links at deploy time.

| Field | Type | Description |
| --- | --- | --- |
| **path** | *String or IPLD Link* | A path to a local file or an IPLD link |

## Footnotes
- [1] https://github.com/ipld/specs
- [2] https://github.com/ipld/specs/blob/master/Codecs/DAG-JSON.md
