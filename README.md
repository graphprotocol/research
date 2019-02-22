# Graph Protocol Research
This repo contains specifications and research papers related to The Graph, a decentralized query protocol for the decentralized web.

## Stages
The following stages apply to papers and specs in this repo.

| Stage | Description | Badge |
| :----- | :----------- | -----: |
| **WIP**       | Specifications which are in progress. Has gaps and is actively being changed and added to. | ![WIP Badge](https://img.shields.io/badge/stage-wip-%23C25F38.svg)
| **Draft**     | Specification is a complete draft. Subject to change heavily. | ![Draft Badge](https://img.shields.io/badge/stage-draft-%23E3CB63.svg)
| **Stable** | Specification is at a state where it is relatively stable. Only slight improvements should be made to the spec. | ![Stable Badge](https://img.shields.io/badge/stage-stable-%233CBFC2.svg)
| **Finished**     | Specification has been fully implemented and should not change, except to address critical issues | ![Final Badge](https://img.shields.io/badge/stage-finished-0075AB.svg)
| **Deferred**  | Specification made it to at least the "Draft" stage but was later rejected. | ![Deferred Badge](https://img.shields.io/badge/stage-deferred-30324F.svg)

## Papers
- ![Deferred Badge](https://img.shields.io/badge/stage-deferred-30324F.svg): [The Graph Whitepaper V1 [Deprecated]]() - This was the whitepaper we used to build interest in our protocol, early in 2018, before we had a team, or funding. Its a useful look into some of our early thinking, but should no longer be considered a source of truth for the protocol design.

## Specs
 - ![Draft Badge](https://img.shields.io/badge/stage-draft-%23E3CB63.svg):  [Hybrid Network Specification](./specs/graph-protocol-v1) - This specification is a hybrid protocol design, intended to bridge the gap between our [hosted service](http://thegraph.com) and our fully decentralized network design. Important elements of the decentralized network are covered here, including several economic mechanisms, interfaces and a high level architecture. Several elements are notably still centralized, such as the dispute management process, payment channels and governance.

## Implementations

🔨 = In Progress

✅ = Implemented

❌ = Not implemented


### Indexing Nodes
|                       | [Graph Node](https://github.com/graphprotocol/graph-node)   |
| :-------------------- | :----------: |
| **Hybrid Network spec**        | |
| *Subgraphs*           | ✅ |
| *GraphQL Schemas*             | ✅ |
| *WASM Mappings*            | ✅ |
| *Index Ethereum Solidity events*            | ✅ |
| *Index IPFS data*            | ✅ |
| *Read Interface*      | ❌ |
| *RPC API*      | ❌ |
| *Payment Channels*      | ❌ |
| *Work Token Economics*      | ❌ |

## Contributing
If you have questions about the contents of this repo, feel free to ask questions in the #research channel of our [Discord](http://thegraph.com/discord).

We don't yet have a formal improvement proposal process, but feel free to submit ideas for improvements to the protocol as issues in this repo.

If you spot an error, gap or useful clarification in one of the specs or papers, feel free to file an issue (or if it is small, submit a PR directly), and you may be listed as a contributor on the spec, if your issue is accepted 🙂.

We look forward to some great contributions from our community, thank you in advance! 🗿✨🚀

## License
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE GRAPH PROTOCOL INC  BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Except as contained in this notice, the names "The Graph" or "Graph Protocol" shall not be used in advertising or otherwise to promote the sale, use or other dealings in this Software without prior written authorization from the Graph Protocol Inc. team.

The Graph is a trademark of Graph Protocol Inc.
