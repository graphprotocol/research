# 1 Queries
# 1.1 Basics
For each type `Entity` which you define in your schema, an `entity` and `entities` field will be generated on the top-level `Query` type.

#### Example
Query for a single `Token` entity defined in your schema:
```graphql
query {
  token(id: 1) {
    id
    owner
  }
}
```
When querying for a single entity, the `id` field is required.

#### Example
Query all `Token` entities:
```graphql
query {
  tokens {
    id
    owner
  }
}
```
# 1.2 Sorting
When querying a collection, the `orderBy` parameter may be used to sort by a specific attribute. Additionally the `orderDirection` can be used to specify the sort direction, `ASC` for ascending or `DESC` for descending.

#### Example
```graphql
query (orderBy: "price", orderDirection: ASC ) {
  tokens {
    id
    owner
  }
}
```

# 1.3 Pagination
When querying a collection, the `first` or `last` parameters can be used to paginate from the beginning or the end of the collection, respectively.

#### Example
Query the first ten tokens:
```graphql
query {
  tokens(first: 10) {
    id
    owner
  }
}
```

In order to query for groups of entities in the middle of a collection, the `skip` parameter may be used in conjunction with either the `first` or `last` parameters to skip a specified number of entities starting at the beginning or end of the collection.

#### Example
Query ten `Token` entities, offset by ten places from the end of the collection:
```graphql
query {
  tokens(last: 10, skip: 10) {
    id
    owner
  }
}
```

Additionally, the `after` or `before` parameters may be used to fetch a group of entities starting at an entity with a specified `id`. The `after` parameter is used in conjunction with `first`, while the `before` parameter is used in conjunction with `last`.

#### Example
Query the ten `Token` entities located after the `Token` with an `id` of `A1234` in the collection:
```graphql
query {
  tokens(first: 10, after: A1234) {
    id
    owner
  }
}
```

#### Example
Query the ten `Token` entities located before the `Token` with an `id` of `A1234` in the collection:
```graphql
query {
  tokens(last: 10, before: A1234) {
    id
    owner
  }
}
```

# 1.4 Ethereum
An `ethereum` field on the top level `Query` type surfaces most of the data you would be able to get through the [Ethereum JSON-RPC API](https://github.com/ethereum/wiki/wiki/JSON-RPC).

#### Example
Query the latest block on the Ethereum blockchain:
```graphql
query {
  block {
    hash
    number
  }
}
```

#### Example
Query an Ethereum transaction by its hash, and fetch the hash of the block it was included in:
```graphql
query {
  transaction(hash: "0x568757dfa0e374b3e89b3fec5bebc88dcdda393f2914d3b651963971a292cf82") {
    block {
      hash
    }
  }
}
```

#### Example
Query the genesis block:
```graphql
query {
  block(tag: EARLIEST) {
    timestamp
  }
}
```

#### Example
Query the ten most recent blocks and their transactions. For each transaction, query
the Ethereum address and balance of the recipient and sender of the transaction:
```graphql
query {
  blocks(last: 10) {
    transactions {
      from {
        address
        balance
      }
      to {
        address
        balance
      }
    }
  }
}
```
See the [Ethereum GraphQL Schema](ethereum.graphql) for the full API.

# 1.5 Confirmations and Finality
In contrast to traditional SQL databases, data that is added to a blockchain be may reverted spontaneously due to [uncled](https://ethereum.stackexchange.com/questions/34/what-is-an-uncle-ommer-block) blocks and block reorganizations.

Apps built atop blockchains require the ability to communicate to users the likelihood that specific data is part of the permanent canonical blockchain. In Bitcoin and Ethereum (proof-of-work) blockchains this is a function of how many 'confirmations' a transaction has (how many blocks were created after this transaction). In pure proof-of-work blockchains a transaction can have many confirmations but is never technically final (i.e. there is always at least an infinitesimally small chance that it may be reverted). In proof-of-stake blockchains on the other hand, including mechanisms such as Casper FFG, blocks and transactions may achieve finality.

In our API we expose this additional information in a `_fields` field that we add to each entity.

#### Example
Query the number of confirmations that the `owner` and `id` fields have on a `Token` entity, as well as whether the current value of the `owner` field is "final" and when it was last updated:
```graphql
query  {
  tokens() {
    id
    owner
    _fields {
      id {
        # The confirmations since the `id` was set is equivalent
        # to the amount of confirmations since the entity was created.
        confirmations
      }
      owner {
        # How many blocks were confirmed after the current value
        # of this field was set.
        confirmations
        # When this field was last modified
        updatedAt
        # Whether the value shown for this field has been finalized
        # Always `false` for pure proof-of-work blockchains.
        final
      }
    }
  }
}

```
# 1.6 Entity and Field Logs
Even if a dApp communicates to users that some data has few confirmations, it would be jarring to see that data change suddenly without explanation. Without additional context, users would not understand whether data changed due to a chain reorganization or a legitimate transaction.

To solve this problem a `_logs` field is generated for each entity in your schema. It provides context as to how an entity arrived at its current value. By default it will show you the most recent operation which modified an entity.

#### Example
Query for all `Token` entities. For each `Token` fetch the most recent operation type and the previous `owner` of that `Token`:
```graphql
query {
  tokens() {
    id
    owner
    _logs {
      operation
      previousValue {
        owner
      }
    }
  }
}
```

We generate a log type for each entity in your schema.

#### Example
A `Token` entity in your schema generates a corresponding `_TokenLog` type:
```graphql
type _TokenLog {
  # The id of the operation
  id: ID!
  # The value of the entity after the operation
  value: Token
  # The value of the entity prior to the operation
  previousValue: Token
  # The type of operation
  operation: Operation
  # The Ethereum transaction which triggered this operation
  transaction: EthereumTransaction
}

enum Operation {
  CREATE
  UPDATE
  DELETE
  # REVERT operations occur in the event of uncles and chain reorganizations
  REVERT
}
```

In the default usage, the `_logs` field will only return operations that are a part of the canonical blockchain; this means no `REVERT` operations. This is so that dApps do not inadvertently present users with data that is part of some "alternate history" blockchain that they have never seen before.

In order to query for operations that were reverted due to chain reorganizations, the `from` field may be used to specify a block which we want the history of operations in the log to be relative to. If the block specified is an uncle block, or part of a chain reorganization, then there may be several `REVERT` operations in the log.

The `_logs(from: '...')` field usage is particularly useful in conjunction with the `ethereum` field specified previously.

#### Example
Query all `Tokens` on initial page load, as well as the latest block hash of the chain that is being queried:
```graphql
query {
  tokens() {
    id
    owner
  }
  ethereum {
    block {
      # The latest block is - '0xeeac66f4785cbd5f37e157be7fa59ae03b3c22d859109052b72cef7b626ee756'
      hash
    }
  }
}
```
Poll to see how the data has changed since the last time you ran the query:
```graphql
query {
  tokens() {
    id
    owner
    # We enter the hash that was returned from the previous query.
    # If the entity has not changed will return an empty array.
    _logs(from: '0xeeac66f4785cbd5f37e157be7fa59ae03b3c22d859109052b72cef7b626ee756') {
      # A `REVERT` operation would indicate that the previously queried
      # block was part of a chain reorganization.
      operation
      # We will be able to see how `age` changed, if at all,
      # since our last query.
      previousValue {
        # The token's owner prior to the operation
        owner
      }
    }
  }
}
```

Several of the operations supported for querying collections of entities are also supported on the `_logs` field. Specifically, `first`, `last` and `orderDirection`, `after` and `before` (though they may not all be used simultaneously, see documentation above).

#### Example
Query the ten most recent logs for a `Token` entity:
```graphql
query {
  tokens() {
    id
    owner
    _logs(last: 10) {
      operation
    }
  }
}
```

The `orderBy` parameter is not supported for `_logs`. Logs will be sorted in the
direction of `from` block parameter to the present block. This order can be reversed by passing in `DESC` to `orderDirection`.

# 2 Subscriptions
Graph Protocol subscriptions are GraphQL spec-compliant subscriptions. Unlike query operations GraphQL subscriptions may only have a single top level field at the root level for each subscription operation.

## 2.1 Basics
The root Subscription type for subscription operations mimics the root Query type used for query operations in order to minimize the cognitive overhead for writing subscriptions.

#### Example
Query all `Token` entities along with their `id` and `owner` attributes:

```graphql
query {
  tokens {
    id
    owner
  }
}
```

Subscribe to all `Token` entity changes and fetch the values of the `id` and `owner` attributes on the updated entity:

```graphql
subscription {
  token {
    id
    owner
  }
}
```

As with the Query API, we can use `_logs` to fetch information about the operation that mutated the entity.

#### Example
Subscribe to all `Token` entity changes and fetch the type of operation:
```graphql
subscription {
  token {
    id
    _logs {
      operation
    }
  }
}
```

## 2.3 Block Reorgs

A key difference from the Query API is that the Subscription API does not support the `from` parameter on the `_logs` field. This is because the subscription already carries the context of what transactions were seen previously by the client and must be reverted in the event of a chain reorganization.
