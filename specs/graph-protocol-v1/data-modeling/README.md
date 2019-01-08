# Data Modeling
The schema of your data source--that is, the entity types, values, and relationships that are available to query--are defined through the [GraphQL Interface Definition Language (IDL)] (http://facebook.github.io/graphql/draft/#sec-Type-System).

## Basics

GraphQL requests consist of three basic operations: `query`, `subscription`, and `mutation`. Each of these has a corresponding root-level `Query`, `Subscription`, and `Mutation` type in the schema of a GraphQL endpoint.

**Note:** Our API does not expose mutations because developers are expected to issue transactions directly against the underlying blockchain from their applications.

It is typical for developers to define their own root `Query` and `Subscription` types when building a GraphQL API server, but with The Graph, we generate these top level types based on the entities that you define in your schema as well as several other types for exploring blockchain data, which we describe in depth in the [Query API](#Queries).

## Entities

Entities are defined as GraphQL types decorated with an `@entity`. All entities must have an `id: ID!` field defined.

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

An attribute on an entity type may be specified as unique, in which case the value for that attribute must be unique among all instances of that entity type.

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

## Built-In Types

### GraphQL Built-In Scalars
All the scalars defined in the GraphQL spec are supported: `Int`, `Float`, `String`, `Boolean`, and `ID`.

### Bytes
There is a `Bytes` scalar for variable-length byte arrays.

Additionally, fixed-length byte scalar types between 1 and 32 bytes are supported: `Byte`, `Bytes1` (an alias for `Byte`), `Bytes2`, `Bytes3` ... `Bytes31`, and `Bytes32`.

### Numbers
The GraphQL spec defines `Int` and `Float` to have sizes of 32 bytes.

This API additionally includes `BigInt` and `BigFloat` number types to represent arbitrarily large integer or floating point numbers, respectively.

There are also fixed-size number types to represent numbers between 1 and 32 bytes long (the suffix is specified by the number of bits).

Signed integers all share the `Int` prefix: `Int8`, `Int16`, `Int24`, `Int32` (an alias of `Int`) ... `Int240`, `Int248`, and `Int256`.

There are corresponding unsigned integer types prefixed with `UInt`: `UInt8`, `UInt16`, `UInt24`, `UInt32` ... `UInt240`, `UInt248`, and `UInt256`.

All number types other than `Int` and `Float`, which are serialized as JSON number types, are serialized as strings.

Even though the serialization format is the same, having the sizes captured in the type system provides better self-documentation and enables tooling that generates convenient deserializers in statically typed languages.

## Value Objects
All types not decorated with the `@entity` decorator are value objects. Value object types may be used as the type of entity attributes but will not have fields generated at the top level `Query` and `Subscription` type and cannot be queried by `ID` because they don't have one.

## Entity Relationships
An entity may have a relationship to one or more other entities in your schema. These relationships may be traversed in your queries and subscriptions.

The Graph implements an [entity-attribute-value (EAV)](https://en.wikipedia.org/wiki/Entity%E2%80%93attribute%E2%80%93value_model) data model in which relationships are unidirectional.

Despite being unidirectional, relationships may be traversed in *either* direction by defining reverse lookups on an entity.

### Basics

Relationships are defined on entities just like any other scalar type, except that the type specified is that of another entity.

#### Example
Define a `Transaction` entity type with an optional one-to-one relationship with a `TransactionReceipt` entity type:
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
Define a `Token` entity type with a required one-to-many relationship with a `TokenBalance` entity type:
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

### Reverse Lookups
Defining reverse lookups can be defined on an entity through the `@derivedFrom` field. This creates a "virtual" field on the entity that may be queried but cannot be set manually through the mappings API. Rather, it is derived from the relationship defined on the other entity.

The type of a `@derivedFrom` field must be a collection since multiple entities may specify relationships to a single entity.

#### Example
Define a reverse lookup from a `User` entity type to an `Organization` entity type:
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
