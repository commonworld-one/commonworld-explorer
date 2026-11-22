# Dependency audit snapshot

**Checked:** 2026-11-22

**Scope:** lockfile used by the Commonworld Explorer source snapshot.

The full `npm audit` reported four moderate entries, all pointing to one underlying advisory in the development-only dependency chain:

`shadcn@4.23.0 → ts-morph@26.0.0 → @ts-morph/common@0.27.0 → minimatch@10.2.6`

The advisory is [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) / CVE-2026-118764. The `npm audit --omit=dev` result was zero vulnerabilities. The affected chain is used by development tooling and is not included as a production dependency in the runtime image.

No dependency or lockfile changes were made in the Explorer source synchronization branch. Npm's suggested automatic fix requires a major `shadcn` upgrade; a direct `minimatch` override would fall outside the dependency's declared range. Any remediation should be handled and tested in a separate dependency update.

These are dated results, not a guarantee about later package versions. Re-run both audit commands against the current lockfile before a future release.
