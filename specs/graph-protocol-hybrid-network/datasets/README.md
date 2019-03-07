# Datasets

## Object Diagram
```
           +--------------+     +-------------------+
           |              |     |                   |
Ethereum   | GNS Registry |     | Staking Contract  |
           |              |     | (Indexing Records)|
           |              |     |                   |
           +--------------+     +-------------------+
                  |1                    |1
                  |                     |
+---------------------------------------------------------------------------------+
                  |                     |
                  |     +------------+  |  +------------+
                  |     |            |  |  |            |
                  |    *|  Subgraph  | *|  |  Index     |
IPFS              +----->  Manifest  +--v--+  Records   |
                        |            |1   *|            |
                        +-----+------+     +------------+
                              |
                 +------------+----------+
                 |                       |
        +--------v-------+       +-------v-------+
        |                |       |               |
        | Mapping        |       | Data Model    |
        | (WASM Module)  |       | (GraphQL IDL) |
        |                |       |               |
        +----------------+       +---------------+

```

## Overview
Datasets that may be queried through The Graph are referred to as *subgraphs* because they represent a subset of the data that is available to query in the network. Subgraphs are defined in a *subgraph manifest*, which is a top-level IPLD document that defines how Ethereum and IPFS data is ingested and loaded into The Graph. Importantly, while the subgraph manifest includes a logical data model for the dataset, it does not specify a specific storage format, database model, or index method. These are defined as *Index Records* and are associated with a subgraph manifest by indexing nodes in the Staking Contract on-chain.

Subgraph manifests are immutable and referenced according to the [IPLD CID v1 specification](https://github.com/ipld/cid#cidv1). This CID is referred to in this specification as a *Subgraph ID*. Mutable names may be assigned to subgraph IDs via the Graph Name Service (GNS). These are not consumed on-chain anywhere in the protocol and are mainly a convenience for users interacting with The Graph. These names may also be used in composing a unified global schema in the query interface of Query Nodes. See [Query Processing](../query-processing) for more information. In future versions of the protocol, names will play a more useful role in various forms of the subgraph composition.

## Subgraph Creation
Creating a subgraph involves the following steps, in no specific order:
- Create subgraph manifest ([Subgraph Manifest](../subgraph-manifest))
- Define data model ([Data Modeling](../data-modeling))
- Define mappings ([Mappings API](../mappings-api))

## Subgraph Deployment
Deploying a subgraph involves the following steps:
1. Deploy subgraph manifest to IPLD and get subgraph ID.
1. Curate or index the subgraph, referenced by subgraph ID, in the Staking Contract ([Mechanism Design](../mechanism-design)).
1. (Optional) Associate a human-friendly name with the SubgraphID in the Graph Name Service.
