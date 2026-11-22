# Upstream and deployment provenance

## Source ancestry

- Upstream project: [Consensys Besu Blockchain Explorer](https://github.com/Consensys-Incorporated/besu-blockchain-explorer)
- Base tag: `0.0.3`
- Base commit: [`b6ac6f095f82b650a8f7401314ec14379bb43f78`](https://github.com/Consensys-Incorporated/besu-blockchain-explorer/commit/b6ac6f095f82b650a8f7401314ec14379bb43f78)
- The EIP-3091 object routes and network-specific presentation are Commonworld modifications; the source and attribution are maintained in this repository.
- License: Apache-2.0; the upstream `LICENSE` is retained.

## Earlier live snapshot checked 2026-11-22 (14:37 UTC; historical)

At 14:37 UTC, read-only inspection of OCI1 found the Explorer application running as image `commonworld-testnet-explorer:oci1-rollout-candidate`, image ID `sha256:bead7817e26a3e5e4fd17ea5704986d6ef59f5389c556f69ac4cdce3543c440a`. The container was running with zero restarts. The public-facing adapter service was active with zero restarts.

The runtime Next.js route manifest included `/tx/[hash]`, `/block/[id]`, `/address/[address]`, and `/token/[address]`. A browser check displayed real data on transaction, block, and address pages. The tested token address belonged to a non-token contract, and the page showed its expected “no supported token metadata” state. The recent token list had no entries in its selected 10-block window. This does not verify rendering for a real ERC-20/ERC-721/ERC-1155 contract.

The active adapter assets match these files in `ops/proxy/`:

| File | SHA-256 |
| --- | --- |
| `ops/proxy/explorer-public-proxy.py` | `f386525dc03f9b478076d77a217698b53394f975f052d3764e29b61f5858f012` |
| `ops/proxy/explorer-transaction.html` | `59934d497c51576223061ae93550d953b0df5c9927a790d3a35121647144e039` |

The verified browser paths showed no known private or Tailscale IP literals. Besu nodes, chain data, RPC gateway, and Cloudflare settings were not changed for this inspection.

## Later OCI1 deployment checked 2026-11-22 (19:52 UTC)

The later deployment report records the Explorer image descriptor digest `sha256:e41005c288a303b05eb202d7ff3f8edbb510ea40eaaf80a9309b98e3633330df` for `linux/amd64`. Its `org.opencontainers.image.revision` label matched source revision `bf1e7c15ec45797c3a123e97786efb8db5efe243`. The transferred archive SHA-256, `77e1178d1b332c78717632a8dd38ec2de0963190b23ef10849e8cdf82ddfb600`, matched on the Mac and OCI1; the image configuration and all nine layer digests matched after export/import. This is artifact-transfer evidence, not a signed build attestation from GitHub Actions.

The source revision added bounded recent-block reads, a three-second in-process cache, request coalescing, a maximum of four parallel block reads and five simultaneous RPC calls on that path. It also disabled validator voting by default and independently guarded both vote APIs. API error responses no longer return raw exception text. The corresponding application changes and tests were merged into public `main` on 2026-11-22 through PR #1 at commit [`abef66a`](https://github.com/commonworld-one/commonworld-explorer/commit/abef66ad6a16fe7bf91378d1c69048e3fe391e88). The OCI-specific Compose file and deployment settings are not included.

Post-deployment checks recorded:

| Check | Result |
|---|---|
| Public Explorer routes `/nodes`, `/blocks`, `/validators`, `/transactions`, `/wallets`, `/playground`, and `/tx/<hash>` | HTTP 200 |
| Blocks API | 10 real blocks returned |
| Nodes and Validators | Running, four peers, four active QBFT validators; voting displayed as read-only |
| Public validator propose/discard API calls | Both rejected with HTTP 403 |
| Public RPC identity | Chain ID `11111327` (`0xa98b9f`) |
| Known transaction receipt | Successful receipt, zero effective gas price |

A separate browser smoke on 2026-11-22 ran `/blocks` for 61 seconds with one tab, then 61 seconds with two tabs. Each showed ten real blocks and advancing height, with no browser errors. OCI1 logs recorded 22 and 35 successful `blocksGetRecent` responses in those respective windows and no failed responses; OVH gateway logs for the two-tab window showed no rate, concurrency, queue-rejection, 429, or 502 events. Those log counts are service-wide, not per-tab attribution. This is a short functional check, not a capacity test or soak.

The public source mirror is not the build commit recorded in the OCI image label: `main` now contains the reviewed application patch at `abef66a`, while the image revision label records `bf1e7c15ec45797c3a123e97786efb8db5efe243`. The public commit mirrors that application change set but does not establish that this repository built the deployed image. Keep source-tree comparison and image build provenance as distinct claims.

## Earlier source-tree comparison (before the 19:52 UTC update)

The tracked application/configuration tree in this repository was compared with the local OCI1 rollout workbench snapshot `2db6db123544d95f786e0a324eb8d47523cef55e` across `src/`, `public/`, the Dockerfile, package manifests, and build configuration. Both trees contain the same 99 paths: 76 files are byte-for-byte identical, and the other 23 differ only by a Commonworld attribution comment at the top of the repository copy. No executable or configuration lines differ in this comparison. The public adapter files also match the recorded live candidate hashes above.

This is a source-tree comparison, not a fresh image build or proof from image labels. The remaining source-to-image evidence is summarized below.

## Image-to-source evidence and limitation for the earlier 14:37 image

That earlier runtime image did not include `org.opencontainers.image.source` or `org.opencontainers.image.revision` labels. The later 19:52 image has separate revision-label and archive/layer evidence recorded above; it still has no signed CI provenance attestation documented here.

For future releases, publish `org.opencontainers.image.source` and `org.opencontainers.image.revision` labels and record the archive checksum, image ID, target architecture, and deployment commit together. Do not treat the image tag alone as proof of source revision.

The earlier check was a route and runtime smoke check, not a long soak, load test, or verification of every token standard. Deployment-specific Compose files, service units, absolute host paths, internal RPC URLs, environment files, logs, and database state are intentionally excluded.

## Branch roles

- `master` remains the upstream comparison/synchronization branch.
- `main` is intended to record the latest reviewed Commonworld Testnet deployment snapshot and remain the repository default branch.
- `commonworld-testnet` is the forward development branch. After a change is reviewed and deployed, advance `main` to that deployed commit (normally by fast-forward).
- `codex/sync-deployed-explorer-20261122` carried the application patch identified by the 19:52 UTC deployment record and was merged into `main` through PR #1 at `abef66a`.

At the start of this review, `commonworld-testnet` and `main` both pointed to `2fe875282193413d9c49b0b34960bb687cb9399e`. PRs #1 and #2 advanced `main` to `6e79cf9fc67a90e01251a9a196ae6e4d97bac05c`. On 2026-11-23, `commonworld-testnet` was fast-forwarded to that reviewed baseline so future development starts from the deployed application snapshot.

## Dependency audit

The dated 2026-11-22 audit result and its scope are recorded in [DEPENDENCY_AUDIT.md](DEPENDENCY_AUDIT.md). The application dependency files were not changed as part of that review.
