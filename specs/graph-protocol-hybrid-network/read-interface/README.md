# Read Interface

## Overview
To participate in the data retrieval market, Indexing Nodes implement a low-level read interface to the data they store. The read interface not only provides the means of retrieving data from an Indexing Node, but it also defines a contract that an Indexing Node is agreeing to uphold or else be slashed. This is enabled by attestations, which assert that a response was produced correctly and may be verified on-chain.

The design of the read interface is based on the following considerations:
1. Queries must be deterministically repeatable and verifiable: if two Indexing Nodes maintain the same data, submitting the same query to them must yield the same result, even if the two queries are done at different points in time. In particular, it should not matter how much of the underlying block chains the Indexing Nodes have indexed when the query happens, only that the data needed to perform the query is present on both.
1. Query costs must be verifiable: the cost that an Indexing Node charges for running a query must be computable from data that is available to any Indexing Node that indexes a given subgraph. Just as with query results, all Indexing Node must charge the same amount of gas for the same query. The gas cost of a query can though be based, at least in part, on the size of the query result.
1. Querying must be efficient: since Query Engine and Indexing Node communicate over general-purpose Internet connections, the Read Interface must make sure that the number of roundtrips and the amount of data sent between Query Engine and Indexing Node is as small as possible.

## Query Requests and Responses
An Indexing Node's read interface offers a `query` operation that allows accessing the data of a subgraph using a subset of SQL.

Calling the `query` operation is done via JSON RPC 2.0[<sup>1</sup>](#footnotes). See the full [JSON RPC API](../rpc-api).

The `query` method accepts the following parameters:
1. `Object`
 - `blockHash`: `Object` - The hashes of blocks from which to read the data. Currently, the `blockHash` object can only have an `ethereum` property whose value must be the hash of the Ethereum block from which to read the data or the special value `latest`
 - `subgraphID`: `String` - The ID of the subgraph to read from.
 - `query`: `Object` - The query to run against the given `subgraph` at the given `blockHash`.
2. `Object` - A [Locked Transfer](../messages#locked-transfer) message which serves as a conditional micropayment for the read operation.

and returns an `Object` in the response with the following properties:
1. `data`: `any` - The data retrieved by the query.
1. `blockHash`: `Object` - The hashes of the blocks from which the data was queried in the same format as the `blockHash` in the request, except that the value `latest` will not be used.
1. `attestation`: `Object` - An attestation that `data` is a correct response for the given read operation (see [Attestation](#attestation)).

#### A Simple Example
```js
// request
{
  "method": "query",
  "params": [
    {
      "blockHash": {
        "ethereum": "latest"
      },
      "subgraphID": "QmRngUAWqpipGzJULkt6MC5aU1vJyxcbwnkNHeXmn3fHqh",
      // TODO: Use AST, not query string
      "query": "select id, name from domains where labelName = 'addr'"
    }
  ],
  "jsonrpc": "2.0"
}
// response
{
  "data": {
    "domains": [
      {
        "id": "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2",
        "name": "addr.reverse"
      }
    ]
  },
  "blockHash": {
      "ethereum": "0xd2042f2b92fea0de6c4fca82e7d149b932693c4061421b31b159ec1be39e3477"
  },
  // TODO: Provide more realistic attestations
  "attestation": 0x0122340
}
```

## Type system

The precise set of values that needs to be supported still needs to be finalized, but the type system will need to at least allow for strings, ints, bigints, bigdecimals, and byte strings as primitive types.

Composite types are homogenous arrays and maps whose keys are strings and whose values are any value allowed by this type system.

An encoding of values into JSON also still needs to be defined. The encoding will use the GraphQL schema that defines the subgraph to determine the types of attributes mentioned in the query. Processing a query and its result therefore requires knowledge of the subgraph schema.

## Query Syntax

The following grammar describes the queries that the read interface supports. The grammar was chosen such that it is powerful enough to support GraphQL queries, but leaves out large swaths of standard SQL functionality in the interest of simplicity.

It uses the following metasyntactic notation:

|      Symbol     | Meaning                                       |
|-----------------|-----------------------------------------------|
| UPPER CASE NAME | Nonterminal                                   |
| lower case name | Terminal                                      |
|  `::=`          | Definition of nonterminal                     |
|  A &#124; B     | Both `A` and `B` are valid productions        |
|  `[ EXPR ]`     | Optional expression                           |
|  `[ EXPR ]*`    | Optional expression with arbitrary repetition |
|  `/regexp/`     | Regular expression                            |


The entire query follows this grammar:

```
    QUERY ::= select FIELD [, FIELD]*
                from TABLE_REF
                     [[inner|left outer] join] TABLE_REF on JOINCOND
              [where PREDICATE]
              [order by ATTR [asc|desc]]
              [limit INT]
            | QUERY union all QUERY
```

with the following nonterminals:

```
    TABLE_REF ::= NAME [as NAME]
                | (QUERY) as NAME
    FIELD     ::= ATTR [as NAME]
                | map(NAME) as NAME
                | collect(NAME) as NAME over NAME [, NAME ]*
    ATTR      ::= NAME . NAME
    JOINCOND  ::= ATTR = ATTR [and ATTR = ATTR]*
    PREDICATE ::= ATTR OP VALUE
                | VALUE OP ATTR
                | PREDICATE and PREDICATE
                | PREDICATE or PREDICATE
                | not PREDICATE
                | (PREDICATE)
    OP        ::= = | != | < | <= | > | >=
                | in
                | contains | starts with | ends with
    VALUE     ::= 'STRING' | INT | ( VALUE [, VALUE ]* )
                | literals for whatever other types we'll support
    NAME      ::= /[A-Za-z][A-Za-z_]*/
    INT       ::= /[0-9]+/

```

### AST representation

Queries are transmitted as abstract syntax trees, not as text. The precise representation of the abstract syntax tree in JSON still needs to be defined.

## Query semantics

Most of the semantics of a `QUERY` are the same as in standard SQL; some of the deviations from standard SQL deserve more of an explanation:

### Tables

The tables that are available for use by queries correspond to the entities defined in a subgraph's schema, and the columns of those tables are the attributes of those entities, with the exception of derived attributes. Table and column names use snake case so that an attribute `mainBand` in the subgraph schema would be accessed as the `main_band` column.

### Fields

The definition of `FIELD` is motivated by the specific needs of performing GraphQL queries. A `FIELD` can be one of:

- a reference to a column of one of the tables in the `from` clause
- the special function `map` applied to a row which results in a map whose keys are the names of the columns of the row and whose values are the corresponding column values
- the special function `collect` which takes a set of rows of one of the tables we are selecting from that have the same values on the columns in the `over` clause and puts them into an array of maps.  It is a simplified version of what in standard SQL would be expressed as a `GROUP BY` clause in combination with a function that aggregates into an array

### Join condition

The query syntax only allows joining on the equality of attributes (equijoin) but not on more general conditions like `table1.attr <= table2.attr` in an effort to limit the complexity of queries. It is also not possible to express antijoins with this syntax.

Joins can either be _inner_ joins, which makes it possible to filter by the attributes of related objects, or _left outer_ joins, which makes it possible to include optional related objects in the query results.

### Where clause

The `where` clause allows arbitrary boolean expressions, but only ones where an attribute is compared to a constant value, as attribute to attribute comparisons represent join conditions and can only appear in a join clause.

The `in` operator is used to check whether an attribute is one of a list of possible values, for example, `m.color in ('blue', 'green')`.

The `contains`, `starts with`, and `ends with` operators check whether a string attribute contains, starts with or ends with the given value, for example, `m.title contains 'foo'`.

### Paging

Clients need to be able to page through a possibly large result set. The `limit` clause allows clients to specify how many results should be sent back; the point at which to start generating results in the larger result set can be indicated by an appropriate condition in the `where` clause. For example, a query to list musicians might look like

```sql
    select m.id, m.name
      from musicians as m
     order by m.name, m.id
     limit 10
```

The next page of the list of musicians can be generated with the query
```sql
    select m.id, m.name
      from musicians as m
     where m.id > $last_id
     order by m.name, m.id
     limit 10
```
where the client replaces `$last_id` with the last `id` mentioned in the first result set. The ordering by `name` and `id` is crucial for making paging work; in particular, ordering by `id` resolves possible ambiguities if more than one musician have the same name.

### Example

We assume that we are working with a subgraph that stores musicians, bands and their songs using the following schema:
```graphql
type Musician @entity {
    id: ID!
    name: String!
    mainBand: Band
    bands: [Band!]!
    writtenSongs: [Song]! @derivedFrom(field: "writtenBy")
}

type Band @entity {
    id: ID!
    name: String!
    members: [Musician!]! @derivedFrom(field: "bands")
    originalSongs: [Song!]!
}

type Song @entity {
    id: ID!
    title: String!
    writtenBy: Musician!
    band: Band @derivedFrom(field: "originalSongs")
}
```

Queries against such a subgraph can make use of the `musicians`, `bands`, and `songs` table. The ID's of the songs a musician has written can be queried with
```sql
    select s.id
    from musicians as m
    inner join songs as s on s.written_by = m.id
    where m.name = 'John Coltrane'
```

A GraphQL query that lists musicians, their main bands, and the songs they have written
```graphql
    musicians { id mainBand { id } writtenSongs { id } }
```

would correspond to this SQL query
```sql
    select m.id,
           map(main_band) as mainBand,
           collect(songs) as songs over m.id
        from musicians m
             left outer join (select id from bands) as main_band
                             on (m.main_band = main_band.id)
             left outer join (select id from songs) as songs
                             on (songs.written_by = m.id)
```

The result of the query will look like
```js
{
  "data": [
    { "id": "coltrane",
      "mainBand": { "id": "classic_quartet" },
      "songs": [{"id": "resolution"}, {"id": "psalm"}]
    },
    ...
  ]
  // remaining response fields omitted
}
```

## Attestation

The attestation contains a verifiable assurance that the data returned for a query is a correct response for that query.

The details of how to compute an attestation based on the query, the data retrieved, and the block hashes at which the data was retrieved still need to be defined.

## Cost model

The cost of queries needs to cover both the cost of indexing as well as the cost of actually running a query and returning its result. Indexing will incur relatively high fixed costs, which will need to be supported by the cost of queries. In addition, the marginal costs for indexing a subgraph and for expanding query capacity are relatively low, something that needs to be taken into account for the overall cost structure of an index operator.

For any given query, the cost function could take a number of factors into account; given that query cost needs to subsidize fairly large indexing costs, it is probably good enough to work with a fairly coarse cost model. Possibilities here are:

- a constant cost function - every query costs the same regardless of its complexity
- a cost function based on result size - larger results are more expensive than smaller results
- a cost function based on result size and the query itself - more complex queries (measured by static analysis of the query, e.g., the number of joins in the query) are more expensive than simpler queries

Note that cost functions do not need to be linear, and it would therefore entirely possible to, for example, have a cost function that makes querying large amounts of data prohibitively expensive.

Other possible factors that were discussed but will impose a serious burden on the implementation, and will therefore not be used for now are:

- database statistics such as table size or distribution of values: since fisherman will need to check the computation of query cost a while after the query ran, those checks must be time travel queries, and therefore require that these statistics are kept for every block.
- data structure state such as the number of steps a lookup has to take when traversing an index: again, since fishermen perform time travel queries, only data structures that do not mutate their structure would be suitable, and it needs to be possible to traverse them at any given block.

We will collect data on queries, and their result sizes as soon as we can and experiment with queries following the structure above to better understand where a simple cost model would significantly deviate from real life query performance.

## Footnotes
- [1] https://www.jsonrpc.org/specification
- [2] https://github.com/multiformats/multicodec
