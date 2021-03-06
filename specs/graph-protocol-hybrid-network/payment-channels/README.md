# Payment Channels

## Overview
The protocol adopts payment channels, as a means of facilitating micropayments that are paid to Indexing Nodes in exchange for reading from indexes.

The protocol's payment channel architecture follows the Raiden Network Specification[<sup>1</sup>](#footnotes), with a few notable differences:
1. The Graph v1 implements a hub-and-spoke topology that dramatically simplifies payment routing, compared to a fully distributed network topology.
1. The Graph v1 introduces a new concept, *minting channels*, to get around prohibitively large balance requirements for the payment channel hub.
1. The Graph uses an alternate locking mechanism for mediated payments that is tailored to the domain of reading data from indexes.
1. Payment channels are one-way and may be withdrawn from by payment receiver without closing channel. See Payment Channel(#payment-channel).
1. Balance Proofs may be exchanged off-chain directly between the sender and final recipient of a mediate transfer. See [Micropayment Routing](#micropayment-routing).

In this construction, the Payment Channel Hub acts as a *trusted intermediary*, although users of the protocol have no counter-party risk with respect to one another. A future version of this protocol will move away from the hub and spoke topology in favor of a decentralized payment channel network topology. At that point, minting channels will also likely be removed from the specification.

## Hub-and-Spoke Topology
### Architecture
```ascii
       +-------------------+-------------------+------------------+
       |                   |                   |                  |
       |                   |                   |                  |
  +----+-----+        +----+-----+       +-----+----+             |
  |          |        |          |       |          |             |
  | Indexing |        | Indexing |       | Indexing |             |
  | Node     |        | Node     |       | Node     |             |
  |          |        |          |       |          |             |
  +-----^----+        +----^-----+       +-----^----+         Sell GRT/
        |                  |                   |              Buy ETH
        |                  |                   |                  |
        |                  |                   |                  |
        +---GRT-----+     GRT     +-----GRT----+                  |
                    |      |      |                               |
 minting channels   |      |      |                               |
                    |      |      |                               |
                +---+------+------+---+                  +--------v------+
                |                     |      Sell ETH/   |               |
                | Payment Channel Hub +------------------> Token Auction |
                |                     |      Buy GRT     |               |
                +---^------^------^---+                  +---------------+
                    |      |      |
 payment channels   |      |      |
                    |      |      |
      +-----ETH-----+     ETH     +----ETH---+
      |                    |                 |
      |                    |                 |
+-----+------+      +------+-----+     +-----+------+
|            |      |            |     |            |
|  End user  |      |  End user  |     |  End user  |
|            |      |            |     |            |
+------------+      +------------+     +------------+
```
### High-Level Design
End users pay Indexing Nodes via the Payment Channel Hub. Micropayments from end users to the Payment Channel Hub are denominated in ETH or DAI, while micropayments from the Payment Channel Hub to Indexing Nodes are denominated in Graph Tokens, which the Payment Channel Hub mints.

To determine the exchange rate between ETH or DAI and Graph Tokens, the Payment Channel Hub reads from an on-chain Token Auction contract that acts as a price feed. The Token Auction contract also acts as a sink for the Graph Tokens that are minted by the Payment Channel Hub and provides a mechanism for selling the ETH or DAI that the Payment Channel Hub collects.

## Payment Channel Hub
The Payment Channel Hub is a service, an externally owned Ethereum account operated by the Graph Protocol Team. It acts as a counter party for payment channels with end users and for minting channels with Indexing Nodes.

To act as a counterparty for the minting channel contract, the Ethereum account corresponding to the Payment Channel Hub must be designated as a *treasurer* of the Graph Token (GRT) ERC-20 contract, which grants the hub the right to mint Graph Tokens.

## Payment Channel
The payment channel presented here is modeled off the payment channel design in the Raiden Specification[<sup>2</sup>](#footnotes) with the key difference that payments are only made in one direction from the end-user to the Payment Channel Hub. This difference enables other simplifications in the design:
1. Balance proofs may be settled on-chain continuously, without closing the channel.
1. Tokens may be withdrawn from the channel by the Payment Channel Hub continuously, without closing the channel.

As is the case with normal payment channel contracts, deposits may be made by participants, specifically the end-user, on an ongoing basis. For the end-user to withdraw tokens that they deposited, the channel must be closed and settled.

## Minting Channel
Traditional payment channels involve exchanging off-chain messages that are "backed" by a deposit in a channel on-chain, which may be used to settle the final balance when the payment channel is closed. We present a variation on this construction, where instead of being backed by a deposit, payments in the channel are backed by the ability of one participant, the sender, to mint the token that the micropayments are denominated in.

Specifically, the Payment Channel Hub has the ability to mint Graph Tokens to pay Indexing Nodes an amount equivalent to the amount of ETH or DAI paid toward that Indexing Node by an end user. The minting channel acts as the second leg of a mediated transfer.

The minting channel should be settled once per *round*. See [Mechanism Design](../mechanism-design) for more information.

## Micropayment Routing
Because of the hub-and-spoke payment channel, micropayment routing is trivial. Payment must always go through the Payment Channel Hub, and only deposits in the first leg of the mediate payment need be checked to confirm that there are sufficient funds to cover the transfer. As such, balance proofs may be exchanged directly between sender and final recipient of a mediated micropayment, and the receiver may send messages to the payment channel hub on the sender's behalf. This facilitates sending valid [Locked Transfer messages](.../messages) in-band with requests to the [JSON RPC API](../rpc-api).

## Token Auction
With the minting channel construction, new Graph Tokens are minted in direct proportion to the amount of value exchanged between end users and Indexing Nodes in a given round. The Token Auction acts as a sink for these new Graph Tokens, whereby the Payment Channel "buys back" the Graph Tokens previously minted in exchange for the ETH or DAI collected in the payment channels through an on-chain auction mechanism.

**TODO** [Select on-chain auction/ price feed mechanism.](https://github.com/graphprotocol/research/issues/79)

The Token Auctions implemented as smart contracts on the Ethereum blockchain also act as on-chain price feeds, indicating an exchange rate between the supported tokens and GRT. This may be used by the Payment Channel Hub to determine the amount of Graph Tokens to send on the second leg of the mediated transfer via the minting channel.

## Data Retrieval Timelock
Traditional mediated transfers via payment channels use a hash timelock, in which payments are unlocked by providing the pre-image to a hash. In The Graph, micropayments are unlocked by the Indexing Node performing useful work, that of reading from an index, and providing an attestation that the work was performed correctly. Rather than having a fixed amount of tokens locked, the amount of tokens unlocked are dynamic, based on the amount of bandwidth and computation required to fulfill the request, and maximum computation and bandwidth limits which is defined in the lock.

See [Data Retrieval Timelock](../messages#data-retrieval-timelock) in the Messages section of the specification.

## Footnotes
- [1] https://github.com/raiden-network/spec
- [2] https://raiden-network-specification.readthedocs.io/en/latest/smart_contracts.html#tokennetwork-channel-protocol-overview
