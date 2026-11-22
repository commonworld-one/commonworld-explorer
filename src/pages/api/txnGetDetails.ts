// Commonworld Testnet modifications/additions; see NOTICE.
import { apiRoute } from "@/lib/api.server";
import { ethApiCall } from "@/lib/rpc";
import { requireHash, requireString } from "@/lib/validate";
import type { RpcReceipt, RpcTransaction, TransactionDetails } from "@/types/DetailPages";

export default apiRoute<TransactionDetails>(async (body) => {
  const rpcUrl = requireString(body, "rpcUrl");
  const hash = requireHash(body, "hash");
  const transaction = await ethApiCall<RpcTransaction | null>(rpcUrl, "eth_getTransactionByHash", [hash]);
  if (!transaction || !transaction.blockNumber) {
    return { transaction, receipt: null, blockTimestamp: null, latestBlock: null };
  }
  const [receipt, block, latestBlock] = await Promise.all([
    ethApiCall<RpcReceipt | null>(rpcUrl, "eth_getTransactionReceipt", [hash]),
    ethApiCall<{ timestamp: string } | null>(rpcUrl, "eth_getBlockByNumber", [transaction.blockNumber, false]),
    ethApiCall<string>(rpcUrl, "eth_blockNumber"),
  ]);
  return { transaction, receipt, blockTimestamp: block?.timestamp ?? null, latestBlock };
});
