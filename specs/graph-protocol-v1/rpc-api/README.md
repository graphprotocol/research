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
 - `gasPrice`: `Number` | `null` - The price of a unit of gas. If no price denominated in the specified token, `null`.
 - `bandwidthPrice`: `Number` | `null` - The price of sending one byte over the network. If no price denominated in the specified token, `null`.

#### Example
```js
{
  "method": "getPrices",
  "params": ["DAI"],
  "jsonrpc": "2.0"
}

// response
{
  "result": [
    {
      "token": "DAI",
      "bandwidthPrice": 0.01,
      "gasPrice": 0.025

    }
  ],
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
Returns one of the following message types:

##### Read Result
`Object`
 - `type`: `String` - The constant "READ_RESULT"
 - `data`: `any` - The data retrieved by the read operation, if any.
 - `attestation`: Object - An attestation that `data` and `type` is a correct response for the given read operation (see [Attestations](#attestations)).

##### Out of Gas
Indicates that that the gas limit was consumed without completing the computation. Payment will still be made to the Indexing Node for computation performed. No data is returned.
`Object`
 - `type`: `String` - The constant "NOT_ENOUGH_GAS"
 - `attestation`: Object - An attestation that `type` is a correct response for the given read operation (see [Attestations](#attestations)).

##### Not Enough Bandwidth
Indicates that that the bandwidth limit is insufficient to cover the response size. Payment will still be made to the Indexing Node for computation performed (but not for bandwidth). No data is returned.
`Object`
 - `type`: `String` - The constant "NOT_ENOUGH_BANDWIDTH"
 - `attestation`: Object - An attestation that `type` is a correct response for the given read operation (see [Attestations](#attestations)).

##### Insufficient Funds
Indicates that that there are insufficient funds in the payment channel to cover the maximum amount of tokens that may be spent completing the read operation.
`Object`
 - `type`: `String` - The constant "INSUFFICIENT_FUNDS"

##### Price Too Low
Indicates that the price offered for gas or bandwidth is lower than what the Indexing Node will accept. Response includes up-to-date prices.
`Object`
 - `type`: `String` - The constant "PRICE_TOO_LOW"
 - `prices`: `Object` - The currently advertised prices for the Indexing Node
   - `token`: `String` - The symbol of the token which the prices are denominated in.
   - `gasPrice`: `Number` | `null` - The price of a unit of gas. If no price denominated in the specified token, `null`.
   - `bandwidthPrice`: `Number` | `null` - The price of sending one byte over the network. If no price denominated in the specified token, `null`.

##### Must Include Payment
Indicates that the Indexing Nodes expects a conditional micropayment to be included with the request.

`Object`
 - `type`: `String` - The constant "MUST_INCLUDE_PAYMENT"



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
