# Commonworld Explorer roadmap

This roadmap describes areas of work without delivery dates. A roadmap item is not a release commitment.

## In the current deployed snapshot

- Direct transaction, block, address, and token pages.
- Commonworld Testnet labels and root-level list routes.
- Filtering internal peer transport details from page data.
- Server-side response adaptation for public Explorer presentation.

The live snapshot on 2026-11-22 included the custom application build and public adapter. Direct transaction, block, and address pages were browser-checked. A real token contract and long-duration/load behavior still need separate verification. See [deployment provenance](docs/UPSTREAM.md).

## Product and interface

- Keep list pages and direct object pages visually consistent with the Besu Explorer experience while making Commonworld branding clear.
- Preserve stable shareable paths for transactions, blocks, addresses, and tokens.
- Improve loading, empty, invalid-input, and unavailable states so they are distinguishable.
- Review keyboard access, mobile layout, and accessibility for the main routes.

## Data and indexing

- Document the exact history window each page can query through the current RPC-only design.
- Decide whether a separate indexer is needed for complete address, transaction, token, and event history.
- Compare indexer storage, backfill duration, RPC load, backup, and restore costs before choosing an implementation.
- Keep Besu historical state and the Explorer's searchable index as separate data products with separate recovery plans.

## Developer and contract tools

- Assess verified-source publishing and ABI discovery for deployed contracts.
- Add useful network and activity charts only with a documented data source and query budget.
- Document API behavior and limits before offering additional public endpoints.
- Keep Playground signing and transaction submission explicit to the user.

## Operations and releases

- Make builds reproducible and record source commit, dependency lockfile, image digest, and target architecture for each release.
- Embed the source commit in future image metadata so a running image identifies its exact source revision without relying only on a transfer report.
- Add controlled route and API checks before deployment, then verify the same routes after rollout.
- Measure Explorer query volume and resource use against the public RPC limits.
- Keep deployment credentials, internal endpoints, keys, logs, and database snapshots outside the public source repository.
