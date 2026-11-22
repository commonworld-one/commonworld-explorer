// Commonworld Testnet modifications/additions; see NOTICE.
import { apiRoute } from "@/lib/api.server";
import { recentBlocks } from "@/lib/chainData";
import { ethApiCall } from "@/lib/rpc";
import { requireAddress, requireString } from "@/lib/validate";
import type { AddressActivity, AddressPageData } from "@/types/DetailPages";

export default apiRoute<AddressPageData>(async (body) => {
  const rpcUrl = requireString(body, "rpcUrl");
  const address = requireAddress(body, "address");
  const [balance, nonce, code, latestBlock, blocks] = await Promise.all([
    ethApiCall<string>(rpcUrl, "eth_getBalance", [address, "latest"]),
    ethApiCall<string>(rpcUrl, "eth_getTransactionCount", [address, "latest"]),
    ethApiCall<string>(rpcUrl, "eth_getCode", [address, "latest"]),
    ethApiCall<string>(rpcUrl, "eth_blockNumber"),
    recentBlocks(rpcUrl, 10),
  ]);
  const lower = address.toLowerCase();
  const activity: AddressActivity[] = blocks.flatMap((block) =>
    block.transactions
      .filter((txn) => txn.from.toLowerCase() === lower || txn.to?.toLowerCase() === lower)
      .map((transaction) => ({ transaction, timestamp: block.timestamp }))
  );
  const fromBlock = blocks.at(-1)?.number ?? "0x0";
  return { address, balance, nonce, code, activity, fromBlock, toBlock: latestBlock };
});
