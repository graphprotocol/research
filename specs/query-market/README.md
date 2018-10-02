# Query Market Specification

## Intro
The Graph is fundamentally about providing a decentralized query layer to dApps, that operates like an unstoppable public utility. As long as demand exists for querying specific blockchain data, as measured by dApp users’ willingness to pay to have queries processed, then node operators should be incentivized to continue providing the service of indexing decentralized data sources and processing queries.

This document specifies how a user discovers a node indexing particular data, selects a node to process a query, and trustlessly exchanges tokens with that node in exchange for provably correct query responses.

## Protocol Design

### Overview

The Query Market matches end-user clients (*Customer*), who are willing to pay to have a query resolved, with *Query Nodes*, who are willing to do the work of processing a query in exchange for a micropayment.

Query Nodes stake tokens to participate in the Query Market. Query responses are accompanied by an *Attestation* that the response is true as of a certain point in time, as well as a *Merkle Proof* that the response is contained within a *Merkelized Database Index*.

#### Contract Architecture
The following is a conceptual architecture. For performance reasons and gas cost reasons, the actual implementation may vary slightly.

 - **Service Registry** - Maps external account addresses to URIs of Query Nodes.
 - **Staking Contract** - Tracks Query Nodes which have staked Graph Tokens to participate in serving queries on a specific merkelized database index for a specific Subgraph.
 - **Payment Channel Contract** - Establishes a *payment channel* between a Query Node, via the Staking Contract, to an account in a payment channel network.
 - **Dispute Manager** - Is used for creating disputes that a Query Node provided an incorrect response.

#### Anatomy of a Query
A `QUERY` has the following parts:
- `body` - A string representing the query body.
- `language` - The query language being used.


#### Anatomy of a Response
A `RESPONSE`
 - `data` - The response data as JSON or CSV
 - `attestations` - A list of attestations for individual *Query Operations* used to produce the response.
 - `proofs` - A list of Merkle proofs for each Query Operation used to produce the response.


#### High Level Algorithm
##### From a Customer's perspective
Customers running dApps will send queries to a *Gateway Node*, which they either operate or may be operated on their behalf. The Gateway Node carries out the following steps when it receives a query:

1. Query Planning
1. Query Node Discovery
1. Query Node Selection
1. Query Operation Processing & Payment
1. Response Collation

##### From a Query Node's perspective
1. Market Discovery
1. Staking
1. Indexing
1. Query Processing and Payment

### Query Planning
In the Query Planning stage, a given query body is broken down into *Query Operations* which will be run in order to process the query.

Query Operations correspond to database index read operations which may be invoked via the Peer Interface against a Query Node.

Query Operations provide a common interface which can be used to support a variety of different query languages (i.e. GraphQL, SQL, Datalog, etc.).

The Query Node Discovery, Query Node Selection and Query Processing and Payment steps are carried out for each Query Operation produced in this stage.

### Query Node Discovery
In order to make a decision about how to route specific Query Operations, the Gateway Node must first gather information about the performance and pricing of available Query Nodes for the indexes which must be accessed to process the query. This happens in the Query Node Discovery stage.

For each Query Operation, the Gateway Node will read from the Staking Contract, to find a Query Node that is serving requests on indexes required by the Query Operation.

For each Query Node, the Gateway Node sends a `PING` message, to which it will respond with information with a `pricePerByte` as well as a list of Subgraph indexes that it is maintaining. This information, as well as the latency with which the Query Node responded and the number of tokens staked on chain (per Subgraph index), will be recorded by the Gateway Node to be used as inputs in the Query Node Selection stage.

**TODO** What is a good alternative to pinging every single node, from a performance standpoint? This is something a DHT could have mitigated...

**FOR ANALYSIS** Does `pricePerByte` scale linear with the computational and bandwidth costs of a given operation.

| Implementors Note |
| ----------------- |
| The Gateway Node could also store historical latencies for a Query Node, to use moving averages or some other function as inputs to the Query Node Selection stage.

### Query Node Selection
After collecting information about the `pricePerByte`, staking amounts and latency of available Query Nodes, the Gateway Node must select which Query Nodes it will use to run each Query Operation.

While price and performance are fairly intuitive metrics, staking amount is less so. It is a proxy for *economic security*. The higher the staking amount, the more a Query Node has to lose by providing an invalid response, and therefore the more a Customer may trust the result, under the assumption of a robust dispute resolution process.

The implementation details of Query Node Selection, are *extra-protocol*, which is to say that a Query Node is not privy to, nor does it care, why it was selected to fulfill a particular Query Operation.

| Implementors Note |
| ----------------- |
| A naive implementations would be to maximize for a single metric, such as latency or gas price. Alternatively a Gateway Node might consider both price and performance, by applying relative weights to the importance of each metric, perhaps as specified by the Customer. |

### Query Operation Processing and Payment
After Query Node Selection, the Gateway Node calls a read method and sends a micropayment to the Query Node it has selected for each Query Operation.

The most basic payment channel construction allows for micropayments between two parties which are fixed at the time of payment channel creation. In order to support payments between two arbitrary parties, a payment channel network  is required.

In the first version of the protocol, we will use a hub and spoke topology, where the payment channel hub will be a payment network node operated by The Graph, and every participant establishes a payment channel with this centralized hub. In a future version of the protocol, we may switch to a general purpose payment channel network such as Raiden Network.

**TODO** Add citations for the above paragraph. (Raiden and Lightning Whitepaper).

#### Atomic micropayment-request-response swaps

In payment channel networks, micropayments which must traverse multiple hops in the network are "locked". For example, in the Raiden Network, a micropayment is locked by a hash, and then the micropayment is unlocked by providing the pre-image to that hash.

In order to reduce counter party risk, micropayments sent to Query Nodes are also locked by a `requestLock`, which uniquely identifies the request being made to the Query Node. In order to unlock the micropayment, the Query Node must provide a response, a Merkle proof for the response, and an `ATTESTATION` that the response is true.

**TODO** How should a `requestLock` be constructed? Should incorporate Subgraph Index ID, layer 1 block hash, and query operation.

**TODO** How should attestations be constructed? Should be a signature on the `requestLock` as well as the Merkle Proof.

**FOR ANALYSIS** Is the extra engineering here worth the trouble, of just pruning Query Nodes that do not provide responses in exchange for micropayment? How does this compare to Filecoin or Solana data retrieval markets?

### Response Collation
Once the Gateway Node has processed each Query Operation in the Query Plan, it aggregates them into a `RESPONSE` which is returned to the Customer's client which originated the request.
Processing and Payment

### Market Discovery

## Peer Interface

**TODO** What transport/ wire format should we use for the Peer Interface?

## Open Questions
 - Should we allow Query Nodes to return data that they cannot provide a Range Proof (Merkel Proof) for? I.e. Could they provide a STARKS proof instead? This would potentially complicate our gas cost model. Are proofs necessary at all, or could we get by on economics guarantees and interactive disputes?
