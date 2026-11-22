<p align="center">
  <a href="https://commonworld.one/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/commonworld-one/commonworld/main/docs/assets/banner-commonworld-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/commonworld-one/commonworld/main/docs/assets/banner-commonworld-light.svg">
      <img alt="Commonworld. A shared world for humans and agents." src="https://raw.githubusercontent.com/commonworld-one/commonworld/main/docs/assets/banner-commonworld-light.svg" width="880">
    </picture>
  </a>
</p>

<p align="center">
  <a href="https://commonworld.one/">Commonworld</a> ·
  <a href="https://commonworld.one/atlas/">Atlas</a> ·
  <a href="https://raise.commonworld.one/">RAISE</a> ·
  <a href="https://github.com/commonworld-one/commonworld-testnet">Commonworld Testnet</a> ·
  <a href="https://explorer-testnet.commonworld.one/">Testnet Explorer</a> ·
  <a href="https://rpc-testnet.commonworld.one/">Testnet RPC</a>
</p>

# Commonworld Explorer

Commonworld's testnet Explorer, maintained as a fork of the [Besu Blockchain Explorer](https://github.com/Consensys-Incorporated/besu-blockchain-explorer).

> Status: experimental testnet software. Test tokens have no promised monetary value. Zero gas fees do not mean unlimited capacity or zero operating cost.

## Upstream and attribution

This repository is a Commonworld-maintained fork of Consensys' Besu Blockchain Explorer. The application started from upstream tag `0.0.3`, commit [`b6ac6f095f82b650a8f7401314ec14379bb43f78`](https://github.com/Consensys-Incorporated/besu-blockchain-explorer/commit/b6ac6f095f82b650a8f7401314ec14379bb43f78). The upstream Apache-2.0 license and attribution are retained; see [NOTICE](NOTICE).

The branch roles are:

- `master` follows the upstream fork for comparison and selected upstream updates.
- `main` is intended to record the latest reviewed Commonworld Testnet Explorer deployment; it remains on the prior public snapshot until a reviewed change is promoted.
- `commonworld-testnet` is the working branch for the next testnet changes. After a change is reviewed, checked, and deployed, advance `main` to that deployed commit (normally by fast-forward).

The latest recorded OCI1 deployment on 2026-11-22 used image descriptor `sha256:e41005c288a303b05eb202d7ff3f8edbb510ea40eaaf80a9309b98e3633330df`; its revision label matched source revision `bf1e7c15ec45797c3a123e97786efb8db5efe243`. That deployment and its evidence are documented in [docs/UPSTREAM.md](docs/UPSTREAM.md). This review branch mirrors its application changes; the public branch commit is not the commit that built the image, and `main` remains unchanged until review and promotion.

## Commonworld Testnet

- Network: Commonworld Testnet (CWN Testnet)
- Chain ID: `11111327` (`0xa98b9f`)
- Native test currency: Test Commonworld (`tCWN`), 18 decimals
- Public RPC: [rpc-testnet.commonworld.one](https://rpc-testnet.commonworld.one)
- Explorer: [explorer-testnet.commonworld.one](https://explorer-testnet.commonworld.one)

The Explorer's internal RPC connection is server-side configuration. Do not put private RPC URLs, credentials, or deployment environment files in this repository or in browser-visible data.

## What the Commonworld build contains

- Direct object pages at `/tx/<hash>`, `/block/<number-or-hash>`, `/address/<address>`, and `/token/<address>`.
- Root-level Explorer sections for nodes, validators, blocks, transactions, contracts, tokens, Playground, and Wallets.
- Commonworld-native `tCWN` labels while retaining 18-decimal arithmetic.
- Peer display changes that omit internal node and transport addresses from public page data.
- A server-side adapter source snapshot used to keep the internal RPC URL out of browser responses and serve a direct transaction route.
- Blocks reads bounded by a short server-side cache and concurrency limit; public validator voting disabled by default and guarded independently at the API.

The direct transaction, block, and address pages are confirmed in the checked live snapshot. A real token contract was not available in the checked recent window, so token metadata rendering remains to be verified with a token contract. On 2026-11-22, one- and two-tab `/blocks` checks each ran for 61 seconds; both showed 10 real, advancing blocks without browser errors or logged gateway rejection. This is a short smoke check, not a throughput result or long soak. See [the deployment and test evidence](docs/UPSTREAM.md).

## Data and scope

The current application reads chain data from Besu over JSON-RPC. Recent-list views are bounded; they are not a complete lifetime transaction or address index. An Explorer-owned indexer, full-history guarantees, contract-source verification, charts, and additional APIs remain separate design work. The Explorer database, if introduced, will not replace Besu historical state.

This repository contains application source and sanitized examples. It intentionally excludes live environment files, private keys, tunnel credentials, cloud resource identifiers, server logs, and chain database snapshots.

## Local development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for setup. Use a disposable local chain or a read-only RPC. Playground and Wallets can submit transactions when connected to a network; do not sign or submit transactions while doing read-only review.

The 2026-11-22 dependency audit found one underlying moderate advisory repeated as four audit entries in a development-only dependency chain; the production-only audit was clean. No dependency changes were made. See [the dated audit note](docs/DEPENDENCY_AUDIT.md).

## Roadmap

See [ROADMAP.md](ROADMAP.md). Items are intentionally undated and distinguish existing source work from future research.

## Contributing

Corrections and reproducible improvements are welcome. Include the route, chain, test method, and what the evidence does and does not establish. Do not submit secrets, private infrastructure details, wallet keys, or personal data.

* * *

_Commonworld · a shared world for humans and agents_
