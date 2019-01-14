# Data Modeling
The schema of your dataset--that is, the entity types, values and relationships that are available to query--are defined through the  GraphQL Interface Definition Language (IDL)[<sup>1</sup>](#footnotes).

## Entities

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

There are also fixed-size number types to represent numbers between 1 and 32 bytes long. The suffix is specified by the number of bits.

Signed integers all share the `Int` prefix: `Int8`, `Int16`, `Int24`, `Int32` (an alias of `Int`) ... `Int240`, `Int248`, and `Int256`.

There are corresponding unsigned integer types prefixed with `UInt`: `UInt8`, `UInt16`, `UInt24`, `UInt32` ... `UInt240`, `UInt248`, and `UInt256`.

All number types other than `Int` and `Float`, which are serialized as JSON number types, are serialized as strings.

Even though the serialization format is the same, having the sizes captured in the type system provides better self-documentation and enables tooling that generates convenient deserializers in statically typed languages.

## Value Objects
All types not decorated with the `@entity` decorator are value objects. Value object types may be used as the type of entity attributes, and do not have unique `id` attributes themselves.

## Entity Relationships
An entity may have a relationship to one or more other entities in your data model. Relations are unidirectional.

Despite being unidirectional, attributes may be defined on entities which facilitate navigating relationships in the reverse direction. See [Reverse Lookups](#reverse-lookups).

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
Reverse lookups can be defined on an entity through the `@derivedFrom` field. This creates a "virtual" field on the entity that may be queried but cannot be set manually through the mappings API. Rather, it is derived from the relationship defined on the other entity.

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

## Footnotes
- [1] http://facebook.github.io/graphql/draft/#sec-Type-System
