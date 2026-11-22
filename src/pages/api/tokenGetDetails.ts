// Commonworld Testnet modifications/additions; see NOTICE.
import { apiRoute } from "@/lib/api.server";
import { clampBlockCount, recentTokenTransferLogs, tokenInfo } from "@/lib/chainData";
import { ethApiCall } from "@/lib/rpc";
import { requireAddress, requireString } from "@/lib/validate";
import type { ContractDetails } from "@/types/Explorer";
import type { RpcLog, TokenDetails } from "@/types/DetailPages";

export default apiRoute<TokenDetails>(async (body) => {
  const rpcUrl = requireString(body, "rpcUrl");
  const address = requireAddress(body, "address");
  const count = clampBlockCount(body.count);
  const [code, balance, latestHex] = await Promise.all([
    ethApiCall<string>(rpcUrl, "eth_getCode", [address, "latest"]),
    ethApiCall<string>(rpcUrl, "eth_getBalance", [address, "latest"]),
    ethApiCall<string>(rpcUrl, "eth_blockNumber"),
  ]);
  const isContract = code !== "0x";
  const token = isContract ? await tokenInfo(rpcUrl, address) : null;
  const latest = parseInt(latestHex, 16);
  const fromBlock = Math.max(latest - count + 1, 0);
  const transfers = isContract
    ? await recentTokenTransferLogs(rpcUrl, address, count).catch(() => [] as RpcLog[])
    : [];
  const contract: ContractDetails = {
    address,
    isContract,
    codeSize: isContract ? (code.length - 2) / 2 : 0,
    balance,
    token,
  };
  return {
    contract,
    transfers,
    fromBlock: "0x" + fromBlock.toString(16),
    toBlock: latestHex,
  };
});
