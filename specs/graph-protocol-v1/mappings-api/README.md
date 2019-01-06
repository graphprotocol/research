# Mappings API

## Overview
Mappings define how data is extracted or ingested from one or more data sources, transformed, and then loaded in a format that follows a specific data model. At their core, mappings are simply WASM Modules, and the mappings API is a set of host external functions that are injected into the WASM runtime and implement a specific interface. These function interfaces are in-protocol.

Additionally, extra-protocol APIs may be defined in userspace, which implement an API in a higher-level language that compiles to WASM. The Graph Protocol team created one such API, which is included here as a reference example.

**TODO** I don't see that an example is included. Are you talking about the bottom portion of this document?

## WASM API
The Mappings API can be split into two portions, the *ingest* or *extract* API and the *store* API (how data is loaded). We present an ingest API tailored to event-sourcing Ethereum smart contract data, but future versions of the protocol will enable ingest APIs specific to other decentralized data sources. The *store API* will not need to change to support new data sources.

**Note:** There are also a number of utility functions that are currently injected into the WASM runtime for convenience. These will either be implemented natively in WASM or fully specified in a future version of this spec.

### Ingest
#### Ethereum
Data is ingested from Ethereum by event-sourcing Solidity events, as well as other triggers, defined in the subgraph manifest. The WASM module referenced in a subgraph manifest is expected to have handlers that correspond to the handlers defined in the subgraph manifest ([Subgraph Manifest](../subgraph-manifest)).

See this [reference implementation](https://github.com/graphprotocol/graph-node/blob/master/runtime/wasm/src/host.rs) for how these handlers should be called.

Additionally, we inject functions for calling Ethereum smart contracts for additional data that is not included in the Ethereum event:
- ethereum_call

See this [reference](https://github.com/graphprotocol/graph-node/blob/master/runtime/wasm/src/host_exports.rs) for these additional functions.

### Store
The store API includes the following methods:
- set
- get
- remove

See this [reference implementation](https://github.com/graphprotocol/graph-node/blob/master/runtime/wasm/src/host_exports.rs) for these external functions.

### Utilities
We currently inject the following utility functions into the WASM runtime, which may be changed or removed in a future version of the protocol:
- bytes_to_string
- bytes_to_hex
- big_int_to_hex
- big_int_to_i32
- json_to_i64
- json_to_u64
- json_to_f64
- json_to_big_int
- crypto_keccak_256
- big_int_plus
- big_int_minus
- big_int_times
- big_int_divided_by
- big_int_mod
- string_to_h160

See this [reference implementation](https://github.com/graphprotocol/graph-node/blob/master/runtime/wasm/src/host_exports.rs) for these external functions.

## Higher-Level APIs
Higher-level APIs provide context for the low-level APIs, described above, in a higher-level programming language that compiles to WASM.

### AssemblyScript
[AssemblyScript](https://github.com/AssemblyScript/assemblyscript/wiki) is a subset of TypeScript that compiles to WASM. It only natively supports a handful of types, 32 and 64-bit floating point and integer numeric types, but we extend the runtime with additional higher-level types, such as `TypedMap` and `BigInt`, to facilitate a more developer-friendly API.

See this [reference](https://github.com/graphprotocol/graph-ts/blob/master/index.ts) for all types, external functions, and utilities.

#### Types
##### Basic Types
- `TypedMap<K, V>`
- `TypedMapEntry<K, V>`
- `BytesArray`
- `Bytes`
- `BigInt`
- `Value`
- `ValueKind`
- `ValuePayload`

##### Serialization Formats
- `JSONValue`
- `JSONValueKind`
- `JSONValuePayload`

##### Ethereum Types
- `EthereumValue`
- `EthereumValueKind`
- `EthereumBlock`
- `EthereumTransaction`
- `EthereumEvent`
- `EthereumEventParams`
- `SmartContractCall`
- `SmartContract`

##### Store Types
- `Entity`

#### Ingest
##### Ethereum
- `ethereum.call`

##### IPFS
- `ipfs.cat`

#### Store
- `store.set`
- `store.get`
- `store.remove`

#### Utilities
- `crypto.keccak256`
- `json.fromBytes`
- `json.toI64`
- `json.toU64`
- `json.toF64`
- `json.toBigInt`
- `typeConversion.bytesToString`
- `typeConversion.bytesToHex`
- `typeConversion.bigIntToString`
- `typeConversion.bigIntToString`
- `typeConversion.stringToH160`
- `typeConversion.i32ToBigInt`
- `typeConversion.bigIntToI32`
- `bigInt.plus`
- `bigInt.minus`
- `bigInt.times`
- `bigInt.dividedBy`
- `bigInt.mod`
