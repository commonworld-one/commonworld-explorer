# Upstream and deployment provenance

## Source ancestry

- Upstream project: [Consensys Besu Blockchain Explorer](https://github.com/Consensys-Incorporated/besu-blockchain-explorer)
- Base tag: `0.0.3`
- Base commit: [`b6ac6f095f82b650a8f7401314ec14379bb43f78`](https://github.com/Consensys-Incorporated/besu-blockchain-explorer/commit/b6ac6f095f82b650a8f7401314ec14379bb43f78)
- The EIP-3091 route work is based on Commonworld source commit `30f06d7`; see the private rollout record for the candidate preparation history.
- License: Apache-2.0; the upstream `LICENSE` is retained.

## Live snapshot checked 2026-11-22

At 14:37 UTC, read-only inspection of OCI1 found the Explorer application running as image `commonworld-testnet-explorer:oci1-rollout-candidate`, image ID `sha256:bead7817e26a3e5e4fd17ea5704986d6ef59f5389c556f69ac4cdce3543c440a`. The container was running with zero restarts. The public-facing adapter service was active with zero restarts.

The runtime Next.js route manifest included `/tx/[hash]`, `/block/[id]`, `/address/[address]`, and `/token/[address]`. A browser check displayed real data on transaction, block, and address pages. The tested token address belonged to a non-token contract, and the page showed its expected “no supported token metadata” state. The recent token list had no entries in its selected 10-block window. This does not verify rendering for a real ERC-20/ERC-721/ERC-1155 contract.

The active adapter assets match these files in `ops/proxy/`:

| File | SHA-256 |
| --- | --- |
| `ops/proxy/explorer-public-proxy.py` | `f386525dc03f9b478076d77a217698b53394f975f052d3764e29b61f5858f012` |
| `ops/proxy/explorer-transaction.html` | `59934d497c51576223061ae93550d953b0df5c9927a790d3a35121647144e039` |

The verified browser paths showed no known private or Tailscale IP literals. Besu nodes, chain data, RPC gateway, and Cloudflare settings were not changed for this inspection.

## Image-to-source evidence and limitation

The runtime image does not include `org.opencontainers.image.source` or `org.opencontainers.image.revision` labels. The rollout record says the local candidate archive was checksum-verified before transfer; the local and OCI image IDs differed, and a subsequent comparison recorded matching layer digests, platform, and image metadata. That provides artifact-transfer evidence for this candidate, while the running image itself does not declare its Git commit.

For future releases, publish `org.opencontainers.image.source` and `org.opencontainers.image.revision` labels and record the archive checksum, image ID, target architecture, and deployment commit together. Do not treat the image tag alone as proof of source revision.

The current check was a route and runtime smoke check, not a long soak, load test, or verification of every token standard. Deployment-specific Compose files, service units, absolute host paths, internal RPC URLs, environment files, logs, and database state are intentionally excluded.

## Branch roles

- `master` remains the upstream comparison/synchronization branch.
- `main` is the latest captured Commonworld Testnet deployment snapshot and is intended to be the repository default branch.
- `commonworld-testnet` is the forward development branch. After a change is reviewed and deployed, merge that same commit into `main`.

At the time this local branch set was prepared, `commonworld-testnet` and `main` point to the same source snapshot. GitHub publication and changing the default branch are separate actions.
