# 1 Queries
# 1.1 Basics (TODO)

# 1.2 Ethereum (TODO)
We implement a field `ethereum` on our top level `Query` type which surfaces Ethereum related data that is potentially relevant across all data sources.

The `ethereum` field returns the `Ethereum` type:
```
type Ethereum {
  block: EthereumBlock
}

type EthereumTransaction {
  ...
}

type EthereumBlock {
  number: Int
  transactions: [EthereumTransaction]
  parent: EthereumBlock
  ...
}

type EthereumTransactionReceipt {
  ...
}

type EthereumAccount {
  ...
}
```
# 1.3 Block Depth
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
# 1.4 Entity Logs
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

The above API already goes a long way in explaining how data changed, but falls short for complex block reorganizations. For example, what if the data changed due to a reversion, should the last transaction be the reversion, or should it be the last valid transaction on the new canonical chain after the reversion? Similarly does it make sense to show a reversion to a user that never saw data on the reverted chain? Probably not.

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
      # since our lat query.
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

For example, If your schema permits the following query:

```graphql
query {
  allUsers {
    id
    name
    age
  }
}
```

Then you can write the following corresponding subscription:

```graphql
subscription {
  User {
    data {
      id
      name
      age
    }
    operation
    transaction {
      from
      to
    }
  }
}
```

Both the query and the subscription above will fetch data for User entities with id, name and age attributes.

The type of entity subscriptions is the same as the type used for entity logs in the query API.

## 2.3 Block Reorgs
