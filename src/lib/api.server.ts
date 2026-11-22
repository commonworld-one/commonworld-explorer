import type { GetServerSidePropsContext, NextApiHandler } from "next";
import { getServerSession } from "next-auth";
import { authOptions, isAuthDisabled } from "@/lib/auth";
import { loadConfig } from "@/lib/config";
import { getConsensus, RpcError } from "@/lib/rpc";
import { isValidatorVotingEnabled } from "@/lib/featureFlags";

type ApiRouteOptions = {
  validatorVoting?: boolean;
};

// Wraps a POST API route with the auth check and consistent JSON error handling.
// The handler receives the parsed request body and returns the response payload.
export function apiRoute<T>(
  handler: (body: Record<string, unknown>) => Promise<T>,
  options: ApiRouteOptions = {}
): NextApiHandler {
  return async (req, res) => {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }
    if (options.validatorVoting && !isValidatorVotingEnabled()) {
      return res.status(403).json({ error: "Validator voting is disabled" });
    }
    if (!isAuthDisabled() && !(await getServerSession(req, res, authOptions))) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      res.status(200).json(await handler(req.body ?? {}));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const path = (req.url ?? "unknown").split("?", 1)[0];
      console.error(`[api] ${req.method} ${path}: ${message}`);
      if (e instanceof RpcError) {
        res.status(502).json({ error: "The blockchain node could not complete this request" });
      } else {
        res.status(500).json({ error: "The explorer could not complete this request" });
      }
    }
  };
}

// Shared getServerSideProps for every page: node config, consensus and auth state.
export async function getPageProps(ctx: GetServerSidePropsContext) {
  const [config, algorithm] = await Promise.all([loadConfig(), getConsensus()]);
  const disableAuth = isAuthDisabled();
  const validatorVotingEnabled = isValidatorVotingEnabled();
  const session = disableAuth
    ? null
    : await getServerSession(ctx.req, ctx.res, authOptions);
  return {
    props: {
      config: validatorVotingEnabled ? config : { ...config, validators: [] },
      algorithm,
      disableAuth,
      validatorVotingEnabled,
      // Round-trip to drop `undefined` fields, which Next can't serialize.
      session: session ? JSON.parse(JSON.stringify(session)) : null,
    },
  };
}
