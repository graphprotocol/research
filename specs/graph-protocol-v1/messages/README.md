# Messages

## Off-Chain Messages

### Encoding
Off-chain messages are encoded using JSON[<sup>1</sup>](#footnotes), a light-weight data interchange format, and the mostly commonly used format for exchanging data on the web.

Off-chain messages may be referenced in an on-chain message via a Content ID (CID). These are produced according to the IPLD CID V1 specification[<sup>2</sup>](#footnotes).

CIDs must use the canonical CBOR encoding[<sup>3</sup>](#footnotes), and SHA-256 multi-hash.

In producing CIDs for JSON RPC messages, the optional `id` field from the JSON-RPC 2.0 specification should be omitted, as well as the optional conditional micropayment in the `readIndex` params list.

### Message Types

#### Read Operation

##### Fields
| Field Name | Field Type | Description |
| ---------- | ---------- | ----------- |
| blockHash | String | The hash of the Ethereum block as of which to read the data. |
| subgraphID | String | The ID of the subgraph to read from. |
| index | Object | The Index Record corresponding to the index being read from. |
| op | String | The name of the read operation. |
| params | Array<any> | The parameters passed into the called read operation. |

#### Index Record

#### Fields

| Field Name | Field Type | Description |
| ---------- | ---------- | ----------- |
| db | String | The identifier of the database model being used. |
| index | String | An identifier of the index type used for the respective database model. |
| partition | String | The name of the entity or interface which should be covered by the index. |  
| params | Array<String> | Parameters specific to the type of index. |

#### Read Response

##### Fields
There are several possible types for a read response:

###### Success
Sent if the read operation was successful, within the gas and response size limits specified. Includes the return data an attestation that the response is correct.

| Field Name | Field Type | Description |
| ---------- | ---------- | ----------- |
| status     | String     | The constant "SUCCESS"   |
| data       | any        | The result of calling the read operation. |
| attestation | Object | An Attestation, where the `requestCID` is the CID of the object containing the above fields. |

###### Max Gas Exceeded
Sent if the maximum amount of gas specified was consumed before the read operation could complete. The caller of the read operation is responsible for paying for the computation, but not for any bandwidth.

| Field Name | Field Type | Description |
| ---------- | ---------- | ----------- |
| status | String | The constant "MAX_GAS_EXCEEDED" |
| attestation | Object | An Attestation, where the `requestCID` is the CID of the object containing the above field. |

###### Max Bytes Exceeded
Sent if the result of calling the read operation is larger than the `maxBytes` parameter in the data retrieval timelock. The caller of the read operation is responsible for paying for the computation, but not for any bandwidth.

| Field Name | Field Type | Description |
| ---------- | ---------- | ----------- |
| status | String | The constant "MAX_BYTES_EXCEEDED" |

###### Insufficient Funds
Sent if the maximum amount of tokens which may be consumed by the read operation would exceed the balance in the payment channel.

| Field Name | Field Type | Description |
| ---------- | ---------- | ----------- |
| status | String | The constant "INSUFFICIENT_FUNDS". |

###### Price Too Low
Sent if the Indexing Node is unwilling to provide the service at the prices offered by the caller.

| Field Name | Field Type | Description |
| ---------- | ---------- | ----------- |
| status | String | The constant "PRICE_TOO_LOW". |
| askingPrice | Object | A price listing object. |

#### Price Listing
A price listing advertising an Indexing Nodes asking price for computation and bandwidth, denominated in a specific token.

| Field Name | Field Type | Description |
| ---------- | ---------- | ----------- |
| token | String |
| gasPrice | Number | The price of a unit of gas, denominated in the token included in the listing. Must be an integer. |
| bytesPrice | Number | The price per byte in the read operation result data, denominated in the token included in the listing. Must be an integer. |

## On-Chain Messages

### Encoding
Unsigned messages are encoded according to the ABIv2 specification[<sup>4</sup>](#footnotes), while signed messages are encoded according to [EIP 712 specification[<sup>5</sup>](#footnotes).

Signed message formats are accompanied by a typed structured data definition, which can be used to compute the type, the type hash, and the data of a message according to the EIP 712 specification. Types are written as Solidity code, but are intended to be compatible with any language that compiles to EVM bytecode.

#### EIP 712 Domain Separator
The EIP 712 specification requires defining a domain separator to disambiguate signed messages intended for different chains, different protocols, or different versions of the same protocol.

The domain separator for the protocol has the following chain-agnostic parameters:
 - **name** - 'graphprotocol'
 - **version** - '0'

Additionally there are chain-specific parameters:
- mainnet
  - **chainid** - 1
  - **verifyingContract** - TBD
- ropsten
  - **chainid** - 3
  - **verifyingContract** - TBD
- kovan
  - **chainid** - 42
  - **verifyingContract** - TBD
- rinkeby
  - **chainid** - 4
  - **verifyingContract** - TBD

### Message Types
#### Attestation

##### Fields
| Field Name  | Field Type | Description |
| ----------- | ---------- | ----------- |
| requestCID | bytes    | The content ID of the message. |
| responseCID | bytes   | The content ID of the response. |
| gasUsed     | uint256    | The gas used to process the read operation. |
| responseBytes     | uint256    | The size of the response data in bytes. |
| v | uint256 | The ECDSA recovery ID . |
| r | bytes32 | The ECDSA signature r. |
| s | bytes32 | The ECDSA signature v. |

###### EIP712 Struct Type
```solidity
struct Attestation {
  bytes requestCID;
  bytes responseCID;
  uint256 gasUsed;
  uint256 responseBytes;
}
```

#### Balance Proof

##### Fields
| Field Name | Field Type | Description |
| ---------- | ---------- | ----------- |
| chainID  | uint256 | EIP155 chain ID. |
| tokenNetworkAddress | address | Address of TokenNetwork contract (see Raiden specification). |
| channelID | uint256 | Channel identifier inside of TokenNetwork contract. |
| transferredAmount | uint256 | A monotonically increasing amount of tokens which have been sent in the channel.|
| maxLockedAmount | uint256 | The maximum amount of tokens locked in pending transfers. |
| locksRoot | bytes32 | The root of a merkle tree containing all locked data retrieval timelocks. |
| nonce | uint256 | A monotonically increasing nonce value starting at `1`. Used for strictly ordering balance proofs. |
| v | uint256 | The ECDSA recovery ID . |
| r | bytes32 | The ECDSA signature r. |
| s | bytes32 | The ECDSA signature v. |

###### EIP712 Struct Type
```solidity
struct BalanceProof {
  uint256 chainID;
  address tokenNetworkAddress;
  uint256 channelID;
  uint256 transferredAmount;
  uint256 maxLockedAmount;
  bytes32 locksRoot;
  uint256 nonce;
}
```

#### Data Retrieval Timelock

##### Fields
| Field Name | Field Type | Description |
| ---------- | ---------- | ----------- |
| expiration | uint256    | The block until which the locked transfer may be settled on-chain.
| gasPrice | uint256 | Amount of tokens locked.|
| maxGas | uint256 | The maximum amount of gas to be consumed in the read operation. |
| bytesPrice | uint256 | The price to pay per byte served.|
| maxBytes | uint256 | The maximum amount of bytes to be sent over the wire |
| maxTokens | uint256 | The maximum amount of tokens to be paid. |
| requestCID | bytes | The content ID of the read operation to which the Indexing Node must respond with a valid attestation, in order to unlock the payment. |

## Footnotes
- [1] http://json.org
- [2] https://github.com/ipld/cid#cidv1
- [3] https://tools.ietf.org/html/rfc7049#section-3.9
- [4] https://solidity.readthedocs.io/en/develop/abi-spec.html
- [5] https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
