import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./helpers/load-typescript.mjs";

let authDisabled = true;
let votingEnabled = false;
let session = null;
let handlerCalls = 0;
const errors = [];
class MockRpcError extends Error {}

const { apiRoute, getPageProps } = loadTypeScript("src/lib/api.server.ts", {
  "next-auth": { getServerSession: async () => session },
  "@/lib/auth": { authOptions: {}, isAuthDisabled: () => authDisabled },
  "@/lib/featureFlags": { isValidatorVotingEnabled: () => votingEnabled },
  "@/lib/config": {
    loadConfig: async () => ({ rpcUrl: "http://internal-rpc:8545", publicRpcUrl: "https://rpc.example", validators: [{ name: "v1", rpcUrl: "http://validator-private:8545" }] }),
  },
  "@/lib/rpc": {
    getConsensus: async () => "qbft",
    RpcError: MockRpcError,
  },
});

function response() {
  return {
    code: 200,
    body: undefined,
    headers: {},
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
    setHeader(name, value) { this.headers[name] = value; },
  };
}

function request(url = "/api/validatorsPropose?secret=not-for-logs") {
  return { method: "POST", url, body: { rpcUrl: "http://private-rpc", address: "0xabc" } };
}

test("disabled vote API returns 403 before auth or handler", async () => {
  authDisabled = true;
  votingEnabled = false;
  session = null;
  handlerCalls = 0;
  const route = apiRoute(async () => { handlerCalls++; return true; }, { validatorVoting: true });
  const res = response();
  await route(request(), res);
  assert.equal(res.code, 403);
  assert.equal(handlerCalls, 0);
});

test("enabled vote API still requires a signed-in session", async () => {
  authDisabled = false;
  votingEnabled = true;
  session = null;
  handlerCalls = 0;
  const route = apiRoute(async () => { handlerCalls++; return true; }, { validatorVoting: true });
  const res = response();
  await route(request(), res);
  assert.equal(res.code, 401);
  assert.equal(handlerCalls, 0);
});

test("enabled vote API reaches its handler for an authenticated session", async () => {
  authDisabled = false;
  votingEnabled = true;
  session = { user: { email: "owner@example.com" } };
  handlerCalls = 0;
  const route = apiRoute(async () => { handlerCalls++; return { accepted: true }; }, { validatorVoting: true });
  const res = response();
  await route(request(), res);
  assert.equal(res.code, 200);
  assert.deepEqual(res.body, { accepted: true });
  assert.equal(handlerCalls, 1);
});

test("both validator mutation endpoints register the voting feature gate", () => {
  const registrations = [];
  const mocks = {
    "@/lib/api.server": {
      apiRoute: (handler, options) => {
        const route = { handler, options };
        registrations.push(route);
        return route;
      },
    },
    "@/lib/rpc": {
      consensusMethods: { qbft: { propose: "qbft_proposeValidatorVote", discard: "qbft_discardValidatorVote" } },
      ethApiCall: async () => true,
      requireConsensus: async () => "qbft",
    },
    "@/lib/validate": {
      requireAddress: () => "0x0000000000000000000000000000000000000001",
      requireString: () => "http://validator-private:8545",
    },
  };
  loadTypeScript("src/pages/api/validatorsPropose.ts", mocks);
  loadTypeScript("src/pages/api/validatorsDiscardProposal.ts", mocks);
  assert.equal(registrations.length, 2);
  assert.ok(registrations.every(({ options }) => options.validatorVoting === true));
});

test("page props omit configured validator RPC URLs while voting is disabled", async () => {
  authDisabled = true;
  votingEnabled = false;
  const result = await getPageProps({ req: {}, res: {} });
  assert.deepEqual(result.props.config.validators, []);
  assert.equal(result.props.validatorVotingEnabled, false);
});

test("page props include validator configuration only when voting is enabled", async () => {
  authDisabled = false;
  votingEnabled = true;
  session = { user: { email: "owner@example.com" } };
  const result = await getPageProps({ req: {}, res: {} });
  assert.equal(result.props.config.validators[0].rpcUrl, "http://validator-private:8545");
  assert.equal(result.props.validatorVotingEnabled, true);
});

test("API errors return safe messages while logging route details server-side", async () => {
  authDisabled = true;
  votingEnabled = false;
  errors.length = 0;
  const originalError = console.error;
  console.error = (...args) => errors.push(args.join(" "));
  try {
    for (const [error, expectedStatus, expectedMessage] of [
      [new MockRpcError("upstream http://internal-rpc:8545 failed"), 502, "The blockchain node could not complete this request"],
      [new Error("internal path /srv/secret-config.json"), 500, "The explorer could not complete this request"],
    ]) {
      const route = apiRoute(async () => { throw error; });
      const res = response();
      await route(request(), res);
      assert.equal(res.code, expectedStatus);
      assert.deepEqual(res.body, { error: expectedMessage });
      assert.doesNotMatch(JSON.stringify(res.body), /internal-rpc|secret-config/);
    }
  } finally {
    console.error = originalError;
  }
  assert.equal(errors.length, 2);
  assert.ok(errors.every((line) => line.includes("POST /api/validatorsPropose:")));
  assert.ok(errors.every((line) => !line.includes("secret=not-for-logs")));
});
