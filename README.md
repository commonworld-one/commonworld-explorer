# Commonworld Explorer

Commonworld's testnet Explorer, maintained as a fork of the [Besu Blockchain Explorer](https://github.com/Consensys-Incorporated/besu-blockchain-explorer).

[Commonworld](https://commonworld.one) · [Atlas](https://commonworld.one) · [RAISE](https://raise.commonworld.one) · [Commonworld Testnet](https://github.com/commonworld-one/commonworld-testnet) · [Testnet Explorer](https://explorer-testnet.commonworld.one) · [Testnet RPC](https://rpc-testnet.commonworld.one)

> Status: experimental testnet software. Test tokens have no promised monetary value. Zero gas fees do not mean unlimited capacity or zero operating cost.

## Upstream and attribution

This repository is a Commonworld-maintained fork of Consensys' Besu Blockchain Explorer. The application started from upstream tag `0.0.3`, commit [`b6ac6f095f82b650a8f7401314ec14379bb43f78`](https://github.com/Consensys-Incorporated/besu-blockchain-explorer/commit/b6ac6f095f82b650a8f7401314ec14379bb43f78). The upstream Apache-2.0 license and attribution are retained; see [NOTICE](NOTICE).

The `commonworld-testnet` branch contains Commonworld-specific application work and a small public-facing adapter. It is not a claim that the production service is built from this exact branch. The last recorded deployment snapshot (2026-11-21) used the upstream application image with a host-side adapter; the custom application changes in this branch still require a separately reviewed build and rollout.

## Commonworld Testnet

- Network: Commonworld Testnet (CWN Testnet)
- Chain ID: `11111327` (`0xa98b9f`)
- Native test currency: Test Commonworld (`tCWN`), 18 decimals
- Public RPC: [rpc-testnet.commonworld.one](https://rpc-testnet.commonworld.one)
- Explorer: [explorer-testnet.commonworld.one](https://explorer-testnet.commonworld.one)

The Explorer's internal RPC connection is server-side configuration. Do not put private RPC URLs, credentials, or deployment environment files in this repository or in browser-visible data.

## What this branch contains

- Direct object pages at `/tx/<hash>`, `/block/<number-or-hash>`, `/address/<address>`, and `/token/<address>`.
- Root-level Explorer sections for nodes, validators, blocks, transactions, contracts, tokens, Playground, and Wallets.
- Commonworld-native `tCWN` labels while retaining 18-decimal arithmetic.
- Peer display changes that omit internal node and transport addresses from public page data.
- A server-side adapter source snapshot used to keep the internal RPC URL out of browser responses and serve a direct transaction route.

These are source features. They do not certify that each one is live, fully tested, or deployed. Network operation and release require separate checks.

## Data and scope

The current application reads chain data from Besu over JSON-RPC. Recent-list views are bounded; they are not a complete lifetime transaction or address index. An Explorer-owned indexer, full-history guarantees, contract-source verification, charts, and additional APIs remain separate design work. The Explorer database, if introduced, will not replace Besu historical state.

This repository contains application source and sanitized examples. It intentionally excludes live environment files, private keys, tunnel credentials, cloud resource identifiers, server logs, and chain database snapshots.

## Local development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for setup. Use a disposable local chain or a read-only RPC. Playground and Wallets can submit transactions when connected to a network; do not sign or submit transactions while doing read-only review.

## Roadmap

See [ROADMAP.md](ROADMAP.md). Items are intentionally undated and distinguish existing source work from future research.

## Contributing

Corrections and reproducible improvements are welcome. Include the route, chain, test method, and what the evidence does and does not establish. Do not submit secrets, private infrastructure details, wallet keys, or personal data.

* * *

_Commonworld · a shared world for humans and agents_
