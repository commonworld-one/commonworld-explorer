# Local development

## Requirements

- Node.js 24 or newer.
- npm compatible with the lockfile.
- A local disposable EVM network or a read-only HTTP JSON-RPC endpoint.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `BE_RPC_URL` to a server-side JSON-RPC endpoint that the Mac can reach. For a local node, `http://127.0.0.1:8545` is a safe starting example.
3. Keep any actual credentials and internal URLs in the ignored local `.env.local`; never commit that file.
4. Install and run:

   ```sh
   npm ci
   npm run dev
   ```

5. Open `http://127.0.0.1:25000`.

`BE_BASEPATH` controls the Next.js route prefix at build time. Keep it aligned with the reverse proxy's route mapping and the configured auth URL. A root deployment uses an empty value. Do not change a production prefix without testing all list, object, API, and authentication routes together.

## Configuration

- `BE_RPC_URL` is consumed server-side by the Explorer.
- `BE_PUBLIC_RPC_URL` is the endpoint presented to users where applicable.
- `NEXTAUTH_SECRET` must be a locally generated value when authentication is enabled.
- `DISABLE_AUTH=true` is for an isolated local preview only. Do not use it for a network-accessible or production deployment.
- `CWN_LOCAL_EXPLORER=1` is an opt-in local development setting used by the checked-in Next.js configuration; do not enable it in production without reviewing its effect.

The Explorer may be connected to a live network. Playground and Wallets support signing or submission flows; use a disposable account and chain for those actions.

## Verification

Before proposing a release, check the changed routes and the relevant build in an isolated environment. Do not describe a route as live or a behavior as verified based only on its presence in source.
