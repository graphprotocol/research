# 1 Data Model

## 1.1 Overview

The Graph can be conceptualized as a single globally decentralized data warehouse, in which data from public blockchains is transformed, loaded, indexed and cached, so that it may be queried by decentralized applications (dApps).

The Graph comprises a decentralized network of nodes, which interact through the Graph Protocol. Among other things, nodes running the Graph Protocol are responsible for routing and processing queries via a peer-to-peer network. In theory, many disjoint networks could be formed by nodes operating the Graph Protocol, but there is only one network named The Graph.

Sometimes the name "The Graph" will be used in describing aspects of the protocol, for convenience, when in fact these same traits would apply to any network of nodes operating the Graph Protocol.

## 1.2 Package
The Graph allows for querying all data across all blockchains (starting with Ethereum), via a single interface. In order to manage the scale and complexity of this task, GraphQL endpoints are defined in *Packages* which are managed and deployed separately.

A Package is deployed to The Graph by a user or organization and comprises a [Schema](# Schema), one or more [Data Sources](# Data Source) and one or more [Mappings](# Mappings).

Packages can be deployed locally and queried in development, with limited functionality. Once deployed to The Graph, they are aggregated into a single global endpoint and gain the ability to reference other packages. Importantly, entity types in deployed package schemas may reference one another, forming a graph.

### 1.2.1 Schema
The Schema defines the entities and relationships within a given package. It is defined using the GraphQL Interface Definition Language (IDL). See the GraphQL Schema API reference for how these are defined.

### 1.2.2 Data Sources
The Graph is not the source of truth for any particular data, it merely ingests data from public blockchains and decentralized storage networks such as IPFS. The Data Sources are these underlying storage layers, and specifically, abstractions on top of these storage layers such as smart contracts *or* the underlying data structures themselves which form the blockchain, such as a set of blocks or merkelized state trees.

### 1.2.3 Mappings
Mappings define how data from blockchains are processed, transformed and loaded via one or more database transactions. Mappings are executed in a WASM runtime, and are akin to smart contracts in that nodes in The Graph build consensus around the outputs of running a mapping with a given set of inputs.

### 1.2.4 Package Manifest
The Package Manifest is an IPLD spec-compliant YAML file which specifies the *Schema*, *Data Sources* and *Mappings* of a package.

### 1.2.5 Package IDs
Package definitions are immutable, even though the actual data ingested may grow -- each package manifest is hashed in its IPLD canonical serialized form, to produce a unique ID. Nodes in the peer-to-peer network use this ID to communicate who is indexing and caching what data, as well as route queries through the network. The self-certifying nature of package IDs also make them useful for providing attestations and filing disputes.

### 1.2.6 Domains
Package IDs can also be associated with a name in the Graph Name Service (GNS) to provide a mutable reference to a package. This can be useful for writing more human readable queries, always querying the latest version of a package, specifying relationships between packages or mutably referencing a package in smart contracts.

Deploying a package to a domain also enables discoverability, as explorer UIs will be built on top of the GNS.

### 1.2.7 Sub-Domains
An owner of a domain in the GNS may wish to deploy multiple packages to a single domain, and have them exist in separate namespaces. Sub-domains enable this use case, and add an optional additional layer of namespacing beyond that already provided by the top level domains.


## 1.3 Database Model
The Graph adopts an [entity-attribute-value (EAV)](https://en.wikipedia.org/wiki/Entity%E2%80%93attribute%E2%80%93value_model#Structure_of_an_EAV_table) data model in which the state of the world is encoded as a series of facts which are tuples of specific entity, attribute and value combinations.

The model of appending facts, rather than mutating rows in a database, is well suited to achieving immutability--an important property in permissionless, decentralized systems--because new facts can simply supersede older ones without changing any data in place. This makes it feasible to efficiently query at different points in time, or block heights, using indexes that benefit from structural sharing.

The open schema of EAV databases also simplifies allowing users to define their own schemas on which entity types may accrete many attributes over time.

In fact, The Graph's architecture is actually agnostic to the store implementation, and many of the properties we desire could be achieved with more or less difficulty using a SQL database. It's a goal of this project to eventually have multiple competing store implementations. However, in order to have a common language in the protocol and its interfaces, the EAV model has been adopted for the reasons already discussed.

### 1.3.1 Facts
Facts in the the The Graph are tuples of the following fields: *entity*, *attribute*, *value*, *operation* and *transaction*.

#### 1.3.1.1 Entity
The entity field is a globally unique ID which identifies the entity. This ID is comprised of three parts: a *package ID*, an *entity type* and a *local ID* (which is unique within a specific entity).

#### 1.3.1.2 Attribute
The attribute field is a name which uniquely identifies the attribute.

#### 1.3.1.3 Value
The value field is a literal value, or the ID of another entity to which this entity has a relationship.

When specifying a relationship to another entity, a *Package Name* may be used instead of *Package ID*, which will be resolved at query time to a *Package ID*. This enables entities from one package specifying relationships to the entities from the latest "version" of a package with a specific name.

#### 1.3.1.4 Store Transaction
Store transactions are unique identifiers that encapsulate our notion of time and causality. The current state of the world can be derived by looking at all facts associated with store transactions that have taken place up until the current moment. Store transactions are so-called to disambiguate from transactions on blockchains such as Ethereum and Bitcoin. Store transactions are also atomic, meaning that all the facts associated with a transaction should be applied to calculate the state a certain point in time, or none of them should be.

For blockchains such as Ethereum or Bitcoin, the transaction ID is the block hash.

### 1.3.2 Indexes
Entity-attribute-value (EAV) indexes are maintained to support querying all the attribute values for an entity with a given ID.

Attribute-value-entity (AVE) indexes are maintained to support querying entities with a specific value, or within a range of values, for a given attribute.

Value-attribute-entity (VAE) indexes are maintained to support reverse lookups between entities.

In The Graph, all indexes are merkelized data structures, supporting not only efficient access, but providing a means of proving the validity of query responses without downloading all the data for a given entity which produced the index.

### 1.3.3 Store Transaction History
In some EAV database implementations a transaction ID might be chosen such that facts may be sorted by transaction ID to order them in the direction of causality (i.e. chronological history).

The Graph is unique in that data is being ingested from public blockchains, which have a tree-like structure where one branch is agreed upon to be the canonical chain. Since the branch that is the canonical chain can change over time, based on blocks being [uncled](https://ethereum.stackexchange.com/questions/34/what-is-an-uncle-ommer-block) or reverted due to chain reorganizations, The Graph's notion of causality is actually tree-like as well - akin to how Git repositories have separate branches with commits which point to parent commits, and describe separate, but equally legitimate, chronologies of how the repo has changed.

This tree-like structure of store transactions is stored separately in order to support computing the state of the world as of different blocks in the underlying blockchain, by filtering on the relevant set of facts.
