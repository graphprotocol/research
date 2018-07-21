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
When querying a collection, the `orderBy` parameter may be used to sort by a specific attribute. Additionally the `orderDirection` can be used to specify the sort direction, `asc` for ascending or `desc` for descending.

#### Example
```graphql
query (orderBy: "price", orderDirection: asc ) {
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
  ethereum {
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
}
```
See the [Ethereum GraphQL Schema](ethereum.graphql) for the full API.

# 1.5 Confirmations and Finality
In contrast to traditional SQL databases, data that is added to a blockchain be may reverted spontaneously due to [uncled](https://ethereum.stackexchange.com/questions/34/what-is-an-uncle-ommer-block) blocks and block reorganizations.

Apps built atop blockchains require the ability to communicate to users the likelihood that specific data is part of the permanent canonical blockchain. In Bitcoin and Ethereum (proof-of-work) blockchains this is a function of how many 'confirmations' a transaction has (how many blocks were created after this transaction). In pure proof-of-work blockchains a transaction can have many confirmations but is never technically final (i.e. there is always at least an infinitesimally small chance that it may be reverted). In proof-of-stake blockchains on the other hand, including mechanisms such as Casper FFG, blocks and transactions may achieve finality.

In our API we expose this additional information through a `_meta { fields }` field which returns a `_<Entity>_<Field>Meta` type for each entity attribute.

#### Example
Query the number of confirmations that the `owner` and `id` fields have on a `Token` entity, as well as whether the current value of the `owner` field is final and when it was last updated:
```graphql
query  {
  tokens {
    id
    owner
    _meta {
      fields {
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
}

```
# 1.6 Entity and Field Changes
Even if a dApp communicates to users that some data has few confirmations, it would be jarring to see that data change suddenly without explanation. Without additional context, users would not understand whether data changed due to a chain reorganization or a legitimate transaction.

To solve this problem `change`, `latest_change` and `changes` fields are included in each entity entity's `_<Entity>Meta` type as well each field's `_<Entity>_<Field>Meta` type. It provides context as to how an entity arrived at its current value.

#### Example
Query for all `Token` entities. For each `Token` fetch the most recent operation type and the previous `owner` of that `Token`:
```graphql
query {
  tokens() {
    id
    owner
    _meta {
      latest_change {
        id
        operation
        previousValue {
          owner
        }
      }
    }
  }
}
```

#### Example
Query for all `Token` entities. For each `Token` fetch the most recent change of the `owner` field:
```graphql
query {
  tokens() {
    id
    owner
    _meta {
      fields {
        owner {
          latest_change {
            operation
            previousValue
          }
        }
      }
    }
  }
}
```

We generate a an `_<Entity>Change` for each entity in your schema. All changes have this type,
even changes returned by the top level `_meta` field or at the entity attribute level.

#### Example
A `Token` entity in your schema generates a corresponding `_TokenChange` type:
```graphql
type _TokenChange {
  # The id of the operation
  id: ID!
  # The name of the entity type that was modified
  entityType: String!
  # The names of the fields that were modified by the operation
  modifiedFields: [String]!
  # The type of operation
  operation: Operation
  # The value of the entity prior to the operation
  previousValue: Token
  # The Ethereum transaction which triggered this operation
  transaction: EthereumTransaction
  # The value of the entity after the operation
  value: Token
}

enum Operation {
  CREATE
  UPDATE
  DELETE
  # REVERT operations occur in the event of uncles and chain reorganizations
  REVERT
}
```

There are also `change`, `latest_change` and `changes` fields in the type returned by the top-level `_meta` field so that you can easily fetch a change that you've seen previously or fetch changes across multiple entities.

#### Example
Fetch a change that I saw previously while querying the `Token` entity changes:
```graphql
query {
  _meta {
    change(id: 75463) {
       operation
       entityType
       # For the top level `change`, value will be an union
       # of all entity types.
       value {
         id
         ... on Token {
           owner
         }
       }
    }
  }
}
```

In the default usage, the `changes` field will only return changes that are a part of the canonical blockchain; this means no `REVERT` operations. This is so that dApps do not inadvertently present users with data that is part of some "alternate history" blockchain that they have never seen before.

In order to query for changes that were reverted due to chain reorganizations, the `from` field may be used to specify a block which we want the history of changes to be relative to. This is similar, but not identical to, getting the diff between two arbitrary commits of the same git repository. If the block specified is an uncle block, or part of a chain reorganization, then there may be several `REVERT` operations in the list of changes.

The `changes(from: '...')` field usage is particularly useful in conjunction with the `ethereum` field specified previously.

#### Example
Query all `Tokens` on initial page load, as well as the latest block hash of the chain that is being queried:
```graphql
query {
  tokens() {
    id
    owner
  }
  ethereum {
    latest_block {
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
    _meta {
      # We enter the hash that was returned from the previous query.
      # If the entity has not changed will return an empty array.
      changes(from: '0xeeac66f4785cbd5f37e157be7fa59ae03b3c22d859109052b72cef7b626ee756') {
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
}
```

Several of the operations supported for querying collections of entities are also supported on the `changes` field. Specifically, `first`, `last` and `orderDirection`, `after` and `before` (though they may not all be used simultaneously, see documentation above).

#### Example
Query the ten most recent changes for a `Token` entity:
```graphql
query {
  tokens() {
    id
    owner
    _meta {
      changes(last: 10) {
        operation
      }
    }
  }
}
```

The `orderBy` parameter is not supported for `changes`. This is because entity changes map to the structure of the underlying blockchain, which despite having a single canonical chain, is actually a directed acyclic graph, where some nodes in the graph may be reverted due to chain reorganizations. Sorting by timestamp, for example, would tell you very little (and be quite misleading) since the changes being shown would be in completely different histories. Changes therefore will be sorted in the direction of `from` block parameter to the present block, traversing a single path in the graph of changes. This order can be reversed by passing in `desc` to `orderDirection`.

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

As with the Query API, we can use `latest_change`, or `changes` to fetch information about the most recent operation that mutated the entity.

#### Example
Subscribe to all `Token` entity changes and fetch the type of operation:
```graphql
subscription {
  token {
    id
    _meta {
      latest_change {
        operation
      }
    }
  }
}
```

## 2.3 Block Reorgs

A key difference from the Query API is that the Subscription API does not support the `from` parameter on the `changes` field. This is because the subscription already carries the context of what transactions were seen previously by the client and must be reverted in the event of a chain reorganization.

# 3 Schema

The schema of your data source--that is, the entity types, values and relationships that are available to query--are defined through the [GraphQL Interface Definition Langauge (IDL)] (http://facebook.github.io/graphql/draft/#sec-Type-System).

## 3.1 Basics

GraphQL requests consist of three basic operations: `query`, `subscription` and `mutation`. Each of these have a corresponding root-level `Query`, `Subscription` and `Mutation` types in the schema of a GraphQL endpoint.

**Note** Our API does not expose mutations because developers are expected to issue transactions directly against the underlying blockchain from their applications.

It is typical for developers to define their own root `Query` and `Subscription` types when building a GraphQL API server, but with The Graph we generate these top level types based on the entities that you define in your schema, as well as several other types for exploring blockchain data, which we describe in depth in the [Query API](# Queries).

## 3.2 Entities

Entities are defined as GraphQL types decorated by an `@entity` decorator. All entities must have an `id: ID!` field defined on them.

#### Example
Define a `Token` entity:

```graphql
@entity
type Token {
  # The unique ID of this entity
  id: ID!
  name: String!
  symbol: String!
  decimals: Int!
}
```

An attribute on an entity type must be specified as unique, in which case the value for that attribute must be unique amongst all instances of that entity type.

### Example
Define a `File` entity with a unique content hash:
```graphql
@entity
type File {
  id: ID!
  name: String!
  bytes: Bytes!
  length: Int!
  # Only one File entity may be created with a given
  # content hash.
  hash: String! @unique
}
```

## 3.3 Built-in Types

### 3.3.1 GraphQL Built-in Scalars
All the scalars defined in the GraphQL spec are supported: `Int`, `Float`, `String`, `Boolean` and `ID`.

### 3.3.2 Bytes
There is a `Bytes` scalar for variable length byte arrays.

Additionally, fixed length byte scalar types between 1 and 32 bytes are supported: `Byte`, `Bytes1` (an alias for `Byte`), `Bytes2`, `Bytes3` `Bytes4`, `Bytes5`... `Bytes29`, `Bytes30`, `Bytes31` and `Bytes32`.

### 3.3.2 Numbers
The GraphQL spec defines `Int` and `Float` to have sizes of 32 bytes.

This API additionally includes `BigInt` and `BigFloat` number types to represent arbitrarily large integer or floating point numbers, respectively.

There also fixed size number types to represent number between 1 and 32 bytes long (the suffix is specified by the number of bits).

Signed integers all share the `Int` prefix: `Int8`, `Int16`, `Int24`, `Int32` (an alias of `Int`) ... `Int240`, `Int248` and `Int256`.

There are corresponding unsigned integer types prefixed with `UInt`: `UInt8`, `UInt16`, `UInt24`, `UInt32` ... `UInt240`, `UInt248` and `UInt256`.

All number types other than `Int` and `Float`, which are serialized as JSON number types, are serialized as strings.

Even though the serialization format is the same, having the sizes captured in the type system provides better self-documentation and enables tooling which generates convenient deserializers in statically typed languages.

## 3.4 Value Objects
All types not decorated with the `@entity` decorator are value objects. Value object types may be used as the type of entity attributes, but will not have fields generated at the top level `Query` and `Subscription` type and cannot be queried by `ID` (because they don't have one).

## 3.5 Entity Relationships
An entity may have a relationship to one or more other entities in your schema. These relationships may be traversed in your queries and subscriptions.

The Graph implements an [entity-attribute-value (EAV)](https://en.wikipedia.org/wiki/Entity%E2%80%93attribute%E2%80%93value_model) data model in which are relationships are unidirectional.

Despite being unidirectional, relationships may be traversed in *either* direction by defining reverse lookups on an entity.

### 3.5.1 Basics

Relationships are defined on entities just like any other scalar type, except that the type specified is that of another entity.

#### Example
Define a `Transaction` entity type with an (optional) one-to-one relationship with a `TransactionReceipt` entity type:
```graphql
@entity
type Transaction {
  id: ID!
  transactionReceipt: TransactionReceipt
}

@entity
type TransactionReceipt {
  id: ID!
  transaction: Transaction
}
```

#### Example
Define a `Token` entity type with a  (required) one-to-many relationship with a `TokenBalance` entity type.
```graphql
@entity
type Token {
  id: ID!
  tokenBalances: [TokenBalance!]!
}

@entity
type TokenBalance {
  id: ID!
  amount: Int!
}
```

### 3.5.2 Reverse Lookups
Defining reverse lookups can be defined on an entity through the `@derivedFrom` field. This creates a "virtual" field on the entity which may be queried, but cannot be set manually through the mappings API; rather it is derived from the relationship defined on the other entity.

The type of a `@derivedFrom` field must be a collection, since multiple entities may specify relationships to a single entity.

#### Example
Define a reverse lookup from a `User` entity type to a `Organization` entity type:
```graphql
@entity
type Organization {
  id: ID!
  name: String!
  members: [User]!
}

@entity
type User {
  id: ID!
  name: String!
  organizations: [Organization!] @derivedFrom(field: "members")
}
```
