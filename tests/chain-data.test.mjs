import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./helpers/load-typescript.mjs";

let rpcCalls = [];
let active = 0;
let maxActive = 0;
let delayMs = 3;

const { recentBlocks } = loadTypeScript("src/lib/chainData.ts", {
  "@/lib/rpc": {
    async ethApiCall(url, method, params = []) {
      rpcCalls.push({ url, method, params });
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      active--;
      if (method === "eth_blockNumber") return "0x32";
      if (method === "eth_getLogs") return [];
      if (method === "eth_getBlockByNumber") {
        return { number: params[0], transactions: [] };
      }
      throw new Error(`Unexpected method ${method}`);
    },
  },
});

test("50-block request makes bounded reads and never exceeds four block reads plus logs", async () => {
  rpcCalls = [];
  maxActive = 0;
  const blocks = await recentBlocks("http://rpc-50.test", 50);
  assert.equal(blocks.length, 50);
  assert.equal(rpcCalls.length, 52);
  assert.equal(rpcCalls.filter(({ method }) => method === "eth_getBlockByNumber").length, 50);
  assert.ok(maxActive <= 5, `observed ${maxActive} concurrent RPC calls`);
});

test("identical concurrent and cached requests share upstream work and return independent data", async () => {
  rpcCalls = [];
  maxActive = 0;
  const [first, second] = await Promise.all([
    recentBlocks("http://rpc-shared.test", 10),
    recentBlocks("http://rpc-shared.test", 10),
  ]);
  assert.equal(rpcCalls.length, 12);
  assert.deepEqual(first, second);
  assert.notEqual(first, second);
  first[0].number = "mutated";
  const cached = await recentBlocks("http://rpc-shared.test", 10);
  assert.equal(cached[0].number, "0x32");
  assert.equal(rpcCalls.length, 12);
});

test("different requested counts do not share a recent-block response", async () => {
  rpcCalls = [];
  maxActive = 0;
  await Promise.all([
    recentBlocks("http://rpc-counts.test", 10),
    recentBlocks("http://rpc-counts.test", 11),
  ]);
  assert.equal(rpcCalls.filter(({ method }) => method === "eth_blockNumber").length, 2);
  assert.equal(rpcCalls.filter(({ method }) => method === "eth_getBlockByNumber").length, 21);
  assert.equal(rpcCalls.filter(({ method }) => method === "eth_getLogs").length, 2);
  assert.ok(maxActive <= 5, `observed ${maxActive} concurrent RPC calls across distinct queries`);
});
