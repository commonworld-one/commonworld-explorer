// Commonworld Testnet modifications/additions; see NOTICE.
import { apiRoute } from "@/lib/api.server";
import { ethApiCall } from "@/lib/rpc";
import { requireString } from "@/lib/validate";
import type { Block } from "@/types/Explorer";

export default apiRoute<Block | null>(async (body) => {
  const rpcUrl = requireString(body, "rpcUrl");
  const id = requireString(body, "id");
  if (/^0x[0-9a-fA-F]{64}$/.test(id)) {
    return ethApiCall<Block | null>(rpcUrl, "eth_getBlockByHash", [id, true]);
  }
  if (!/^(?:\d+|0x[0-9a-fA-F]+)$/.test(id)) throw new Error("Enter a block height or 32-byte block hash");
  const number = id.startsWith("0x") ? BigInt(id) : BigInt(id);
  return ethApiCall<Block | null>(rpcUrl, "eth_getBlockByNumber", ["0x" + number.toString(16), true]);
});
