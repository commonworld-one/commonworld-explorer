// Commonworld Testnet modifications/additions; see NOTICE.
/** @type {import('next').NextConfig} */
const basePath = process.env.BE_BASEPATH || "";
const localExplorer = process.env.CWN_LOCAL_EXPLORER === "1";

module.exports = {
  basePath,
  reactStrictMode: true,
  // The pinned upstream version triggers a blocking security reminder in
  // agent-driven dev startup. Keep the local-only bypass explicit and opt-in.
  ...(localExplorer ? { experimental: { agentUpgrade: false } } : {}),
  // Self-contained server bundle for a slim Docker image.
  output: "standalone",
  // Exposed to the browser so client-side fetches can prefix API routes.
  env: { NEXT_PUBLIC_BE_BASEPATH: basePath },
  async redirects() {
    if (basePath === "") {
      return [{ source: "/", destination: "/nodes", permanent: false }];
    }
    return [
      { source: "/", destination: `${basePath}/nodes`, basePath: false, permanent: false },
      { source: "/api/:path*", destination: `${basePath}/api/:path*`, basePath: false, permanent: false },
      { source: basePath, destination: `${basePath}/nodes`, basePath: false, permanent: false },
    ];
  },
};
