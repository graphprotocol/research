# Data Modeling
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

An attribute on an entity type may be specified as unique, in which case the value for that attribute must be unique amongst all instances of that entity type.

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
