# JSON RPC API

This API uses [JSON RPC 2.0](https://www.jsonrpc.org/specification), a light-weight, transport agnostic RPC protocol.

## Methods

- getPrices
- ping
- readIndex

## Reference

### getPrices
Retrieves the gas and bandwidth pricing of an Indexing Node in a specific token denomination. Prices returned are informational only, they do not represent a commitment by the Indexing Node.

#### Parameters
1. `String` (optional) - The symbol of the token which prices are being requested in. Valid values are 'ETH' or 'DAI'. If not specified, prices will be returned for all tokens the node denominates prices in.

#### Returns
`Array<Object>`
 - `token`: `String` - The symbol of the token which the prices are denominated in.
 - `gasPrice`: `String` | `null` - The price of a unit of gas. If no price denominated in the specified token, `null`.
 - `bandwidthPrice`: `String` | `null` - The price of sending one byte over the network. If no price denominated in the specified token, `null`.

#### Example
```
{
  "method": "getPrices",
  "params": ["DAI"],
  "jsonrpc": "2.0"
}

// response
{
  "result": {
    "token": "DAI"

  },
  "jsonrpc": "2.0"
}
```

### ping
Pings a node to check that is it is available and gauge the latency of the 'pong' response.

#### Parameters
None

#### Returns
`String` - The string "pong".

#### Example
```js
// request
{
  "method": "ping",
  "jsonrpc": "2.0"
}

// response
{
  "result": "pong"
  "jsonrpc": "2.0"
}
```

### readIndex
Calls a low-level read operation on a database index.

#### Parameters

1. `Object`
 - `blockHash`: `String` - The hash of the Ethereum block as of which to read the data.
 - `subgraphID`: `String` - The ID of the subgraph to read from.
 - `index`: `Object` - The [IndexRecord](#indexes) of the index being read from.
 - `op`: `String` - The name of the read operation.
 - `params`: `[any]` - The parameters passed into the called read operation.
1. `Object` (optional) - A conditional micropayment (see Payment Channels).

#### Returns
1. `Object`
 - `data`: `any` - The data retrieved by the read operation.
 - `attestation`: Object - An attestation that `data` is a correct response for the given read operation (see [Attestations](#attestations)).

#### Example
###### Example - Entity exists
```js
// request
{
  "method": "readIndex",
  "params": [
    {
      "blockHash": "xbf133b670857b983fc1b8f08759bc860378179042a0dba30b30e26d6f7f919d1",
      "subgraphID": "QmTeW79w7QQ6Npa3b1d5tANreCDxF2iDaAPsDvW6KtLmfB",
      "index": {
        "indexType": "kv"
      },
      "op": "get"
      "params": ["User:1"]
    }
  ],
  "jsonrpc": "2.0"
}
// response
{
  "data": {
    "firstName": "Vitalik",
    "lastName": "Buterin",
  },
  // TODO: Provide more realistic attestations
  "attestation": 0x0122340
}
```

###### Example - Entity doesn't exist
```js
// request
{
  "method": "readIndex",
  "params": [
    {
      "blockHash": "xbf133b670857b983fc1b8f08759bc860378179042a0dba30b30e26d6f7f919d1",
      "index": {
        "indexType": "kv"
      },
      "op": "get"
      "params": ["User:1"]
    }
  ],
  "jsonrpc": "2.0"
}
// response
{
  "data": null,
  // TODO: Provide more realistic attestations
  "attestation": 0x0122340
}
```
