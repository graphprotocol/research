# 1 Queries
# 1.1 Basics
For each type `Entity` which you define in your schema, an `Entity` and `allEntities` field will be generated on the top-level `Query` type.

### Example
To query for a single `Token` entity:
```graphql
query {
  Token(id: 1) {
    id
    owner
  }
}
```
When querying for a single entity, the `id` field is required.

### Example
To query all `Token` entities:
```graphql
query {
  allTokens {
    id
    owner
  }
}
```
# 1.2 Sorting
When querying a collection, the `orderBy` parameter may be used to sort by a specific attribute. Additionally the `orderDirection` can be used to specify the sort direction, `ASC` for ascending or `DESC` for descending.

### Example
```graphql
query (orderBy: "price", orderDirection: ASC ) {
  allTokens {
    id
    owner
  }
}
```

# 1.3 Pagination
When querying a collection, the `first` or `last` parameters can be used to paginate from the beginning or the end of the collection, respectively.

### Example
```graphql
query {
  allTokens(first: 10) {
    id
    owner
  }
}
```

In order to query for groups of entities in the middle of a collection, the `skip` parameter may be used in conjunction with either the `first` or `last` parameters to skip a specified number of entities starting at the beginning or end of the collection.

### Example
```graphql
query {
  allTokens(last: 10, skip: 10) {
    id
    owner
  }
}
```

Additionally, the `after` or `before` parameters may be used to fetch a group of entities starting at an entity with a specified ID. The `after` parameter is used in conjunction with `first`, while the `before` parameter is used in conjunction with `last`.

### Example
```graphql
query {
  allTokens(first: 10, after: A1234) {
    id
    owner
  }
}
```

### Example
```graphql
query {
  allTokens(last: 10, before: A1234) {
    id
    owner
  }
}
```

# 1.4 Ethereum
We implement a field `ethereum` on our top level `Query` type which surfaces Ethereum related data that is potentially relevant across all data sources.

The `ethereum` field returns the `Ethereum` type, composed of other ethereum specific types:
```graphql
####
# Several of the comments in this schema were pulled, or paraphrased from:
# https://github.com/ethereum/wiki/wiki/JSON-RPC
####

type Ethereum {
  # Optionally may specify a block number OR a block hash OR a block tag
  # (provided otherwise query will result in an error). If none specified
  # will return the latest block.
  block(number: Int, hash: EthereumHash tag: EthereumBlockTag): EthereumBlock
  blocks: [Blocks]
  transaction(hash: EthereumHash): EthereumTransaction
  transactions: [EthereumTransactions]
}

type EthereumBlock {
  # Arbitrary data optionally included in the block
  extraData: Bytes32
  # The difficulty level of this block
  difficulty: BigInt
  # The current limit of gas expenditure per block
  gasLimit: Int
  # The total used gas by all transactions in the block.
  gasUsed: Int
  # Hash of the block. `null` when block is pending.
  hash: EthereumHash!
  # The bloom filter for the logs of the block. `null` when block is pending.
  logsBloom: Bytes256
  # Hash of the generated proof-of-work. `null` when block is pending.
  nonce: Bytes8
  # The block number
  number: Int
  # Miner of this block, to whom block rewards will be sent
  miner: EthereumAccount
  # Transactions that were included in this block
  transactions: [EthereumTransaction]
  # The block created immediately prior to this block
  parent: EthereumBlock
  # SHA-3 of the uncles data in the block
  sha3Uncles: EthereumHash
  # The size of this block in bytes
  size: Int
  # The root of the final state trie of this block
  stateRoot: EthereumHash
  # Unix time (seconds since the Epoch)
  timestamp: Int
  # The root of the transaction trie of the block
  transactionsRoot: EthereumHash
  # The total difficulty of the chain until this block
  totalDifficulty: BigInt
  # The uncles for this block
  uncles: [EthereumBlock]
}

type EthereumTransaction {
  # Block where this transaction was included. `null` if pending.
  block: EthereumBlock
  # Address of the sender
  from: EthereumAccount
  # Gas provided by the sender
  gas: Int
  # Gas price provided by the sender in Wei
  gasPrice: BigInt
  # SHA-3 hash of this transaction
  hash: EthereumHash
  # The data sent along with the transaction
  input: Bytes
  # The number of transactions made by the sender prior to this one
  nonce: Int
  # Address of the receiver. `null` if contract creation.
  to: EthereumAccount
  # Integer of the transaction's index position in the block. `null` if
  # still pending.
  transactionIndex: Int
  # Value transferred in Wei
  value: BigInt
}

type EthereumTransactionReceipt {
  # The block this transaction receipt was included in
  block: EthereumBlock
  # The created contract, if any. `null` otherwise.
  contract: EthereumAccount
  # The gas used by this and all preceding transactions in the block
  # it was included in
  cumulativeGasUsed: Int
  # Address of the sender
  from: EthereumAccount
  # The amount of gas used by this transaction
  gasUsed: Int
  # The hash of the transaction receipt
  hash: EthereumHash
  # Logs which this transaction generated
  logs: [EthereumLog]
  # Bloom filter for light clients to quickly retrieve related logs
  logsBloom: Bytes256
  # Address of the receiver. `null` when it is a contract creation transaction.
  to: EthereumAccount
  # The associated transaction
  transaction: Transaction
}

type EthereumLog {
# Address from which this log originated
address: EthereumAccount
# The block this log was included in
block: EthereumBlock
# One or more non-indexed log arguments
data: [Bytes32]
# Position in the block. `null` if pending.
logIndex: Int
# True if log has been removed due to chain reorganization. False if valid.
removed: Boolean
# Between one and four indexed values associated with the log
topics: [Bytes32]
# Transaction this log was included in. `null` if still pending.
transaction: Transaction
}

type EthereumAccount {
  # Address of this account
  address: EthereumAddress
  # Balance of this account in Wei
  balance: BigInt
}


enum EthereumBlockTag {
  # The latest mined block
  LATEST
  # Refers to the genesis block or the earliest block the node has stored
  EARLIEST
  # A hypothetical block based on transactions in the mempool
  PENDING
}

# EthereumAddress is a 20 byte hex-encoded string prefixed with a "0x"
scalar EthereumAddress
# EthereumHash values are hex-encoded KECCAK-256 SHA-3 strings with a "0x"
# prefix
scalar EthereumHash

# Bytes scalar values will be sent over the wire as a Base64 encoded String
scalar Bytes8
scalar Bytes32
scalar Bytes256
# Unsized bytes array
scalar Bytes

# Numeric scalars
scalar BigInt
```
# 1.5 Block Depth
Querying data on blockchains is different than querying data in a traditional SQL database because data that is added to a blockchain may reverted spontaneously due to [uncled](https://ethereum.stackexchange.com/questions/34/what-is-an-uncle-ommer-block) blocks and block reorganizations.

Apps built on top of blockchains, therefore, need to be able to communicate to their users how likely any piece of data is to be a permanent part of the blockchain. In Bitcoin and Ethereum (Proof-of-Work) blockchains this is a function of how ‘deep’ the block is in which the transaction affecting the data was added.

**Note**: Some Proof-of-Stake implementations have a concept of finality which is not tied to block depth, which we may expose in this API in the future.

In our API we expose this additional information in a `_depth` field that we add to each entity (note the single `_`, not to conflict with the introspection systems reserved double `_` prefix). It allows you to query the block depth, sometimes called 'confirmations', of each attribute on the entity.

### Example
```graphql
query  {
  allUsers() {
    id
    age
    _depth {
      # Will return the block depth of the transaction which
      # last modified the 'age' field
      age
      # Getting depth of the entity's id attribute effectively
      # gives you the block depth of the entire entity.
      id
    }
  }
}

```
# 1.6 Entity Logs
Even if your dApp communicates to your users that a particular piece of data is not very deep, and subject to be reverted, it can be jarring when that reversion actually happens. If the data your dApp queries changes from one query to the next, how should your users recognize if the change is due to a block reversion or due to a legitimate transaction?

To solve this problem we introduce a `_logs` field on each entity. It provides additional context as to why the current value of an entity is what it is. By default it will show you the last transaction which affected that entity.

### Example
```graphql
query {
  allUsers() {
    id
    age
    _logs {
      # Indicated what type of operation was last performed on
      # the entity (i.e. CREATE, UPDATE, DELETE, REVERT)
      operation
      data {
        # In this case these field are redundant since the
        # values will be the same as the fields queried above.
        id
        age
      }
    }
  }
}
```

For each entity of type `Entity` we generate a type `EntityLog`, which is the type of the list items returned by `_logs`.

### Example
For example, if we have a type `User` in our input schema:
```graphql
type User {
  id: ID!
  age: Int!
  name: String!
}
```

Then the final output schema will include a `UserLog` type:
```graphql
type UserLog {
  data: User
  operation: LogOperation
  transaction: EthereumTransaction
}

enum LogOperation {
  CREATE
  UPDATE
  DELETE
  REVERT
}
```

The above API already goes a long way in explaining how data changed, but falls short for complex block reorganizations. For example, what if the data changed due to a reversion - should the last transaction be the reversion, or should it be the last valid transaction on the new canonical chain after the reversion? Similarly does it make sense to show a reversion to a user that never saw data on the reverted chain? Probably not.

To address this last point, the `_logs` will only return transactions impacting the entity on the canonical chain, which by definition has no block reversions.

In order to query for block reversions, we introduce an input parameter `from` on the `_logs` field to specify what block you want the logs to be relative to. This could be a block on the canonical chain, in which case the logs will again contain no REVERT transactions, but it could also be an uncle block or a reverted block on a temporary chain split, in which case the first few transactions might be REVERT transactions, possibly followed by other transactions.

The `_logs(from: '...')` field usage is particularly powerful when combined with the `ethereum` field described above.

### Example

For example on first page load, your dApp might issue the following query:
```graphql
query {
  allUsers() {
    id
    name
    age
  }
  ethereum {
    block {
      hash
    }
  }
}
```

Then on a subsequent query (perhaps you are polling to keep your UI up to date):
```graphql
query {
  allUsers() {
    id
    name
    age
    # We enter the hash that was returned from the previous query
    _logs(from: '0xeeac66f4785cbd5f37e157be7fa59ae03b3c22d859109052b72cef7b626ee756') {
      operation
      # We will be able to see how `age` changed, if at all,
      # since our last query.
      data {
        age
      }
    }
  }
}
```




# 2 Subscriptions
Graph Protocol subscriptions are GraphQL spec-compliant subscriptions. An important difference between subscription and query operations in GraphQL is that the former may only have a single top level field at the root level for each operation.

## 2.1 Basics
The root Subscription type for subscription operations mimics the root Query type used for query operations in order to minimize the cognitive overhead for writing subscriptions.

For example, if the following is a valid query:

```graphql
query {
  allUsers {
    id
    name
    age
  }
}
```

Then the following subscription would also be valid:

```graphql
subscription {
  User {
    id
    name
    age
    _logs {
      operation
      transaction {
        from
        to
      }
    }
  }
}
```
As with the query API, by not passing in any arguments into the `_logs` field, we indicate that we wish to fetch the most recent transaction that mutated the entity.

## 2.3 Block Reorgs

A key difference between the query and subscription APIs is that with the subscription API it is unnecessary to pass in the `from` argument into `_logs` in order to see REVERT transactions. This is because the subscription already carries the context of what transactions were seen previously by the client and must be reverted in the event of a chain reorganization.
