# Upstream and deployment provenance

## Source ancestry

- Upstream project: [Consensys Besu Blockchain Explorer](https://github.com/Consensys-Incorporated/besu-blockchain-explorer)
- Base tag: `0.0.3`
- Base commit: [`b6ac6f095f82b650a8f7401314ec14379bb43f78`](https://github.com/Consensys-Incorporated/besu-blockchain-explorer/commit/b6ac6f095f82b650a8f7401314ec14379bb43f78)
- License: Apache-2.0; the upstream `LICENSE` is retained.

## Deployment evidence boundary

A local operational snapshot dated 2026-11-21 recorded the then-running Explorer as the upstream `0.0.3` application image with a host-side response adapter. That snapshot is dated evidence, not a live check. The custom Next.js page work in this branch has not been established by that snapshot as the production application build.

The two adapter assets copied into `ops/proxy/` match the hashes recorded in that dated snapshot:

| File | SHA-256 |
| --- | --- |
| `ops/proxy/explorer-public-proxy.py` | `f93b8213f39cd8e9a7a6bd0ea188b575a3bdc43e3d189bb724a2b91d04ac4436` |
| `ops/proxy/explorer-transaction.html` | `59934d497c51576223061ae93550d953b0df5c9927a790d3a35121647144e039` |

These hashes establish that the adapter files match the local dated snapshot, not that the running service is still unchanged today.

Deployment-specific Compose files, service units, absolute host paths, internal RPC URLs, and environment files are intentionally omitted. Before using this branch for a release, record a fresh source-to-image mapping and verify the deployed behavior against the release commit.

## Changes in the Commonworld branch

The branch adds direct object pages, Commonworld Testnet presentation, peer-data filtering, and source for the public-facing adapter. The Git history begins with upstream ancestry and then records Commonworld work separately. See [README](../README.md) and [ROADMAP](../ROADMAP.md).
