// Commonworld Testnet modifications/additions; see NOTICE.
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/Layout/PageHeader";
import { DataList } from "@/components/ui/DataList";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPageProps } from "@/lib/api.server";
import { errorMessage, postApi } from "@/lib/api";
import { formatTokenAmount, hexToEther, hexToNumber, shortenHex } from "@/lib/format";
import type { PageProps } from "@/types/Config";
import type { TokenDetails } from "@/types/DetailPages";
import { useRouter } from "next/router";

function isAddress(value: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

function topicAddress(topic?: string) {
  return topic && /^0x[0-9a-fA-F]{64}$/.test(topic) ? `0x${topic.slice(-40)}` : null;
}

export default function TokenPage({ config }: PageProps) {
  const router = useRouter();
  const address = typeof router.query.address === "string" ? router.query.address : "";
  const [data, setData] = useState<TokenDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !address || !isAddress(address)) return;
    const controller = new AbortController();
    postApi<TokenDetails>("tokenGetDetails", { rpcUrl: config.rpcUrl, address, count: 10 }, controller.signal)
      .then(setData)
      .catch((e) => !controller.signal.aborted && setError(errorMessage(e)));
    return () => controller.abort();
  }, [address, config.rpcUrl, router.isReady]);

  const token = data?.contract.token;
  return (
    <>
      <PageHeader title={token?.name ?? "Token"} description={address || "Token contract address"} />
      {!isAddress(address) && router.isReady ? <EmptyState>This token contract address is not valid.</EmptyState> : error ? <EmptyState>Could not load this token: {error}</EmptyState> : !data ? (
        <div className="space-y-2"><Skeleton className="h-10" /><Skeleton className="h-48" /></div>
      ) : !data.contract.isContract ? <EmptyState>No contract code exists at this address.</EmptyState> : !data.contract.token ? (
        <EmptyState>
          No supported token metadata was found at this contract. It may be a non-token contract. <a className="text-primary hover:underline" href={`/address/${address}`}>View address details</a>.
        </EmptyState>
      ) : <>
        <Card>
          <CardHeader className="border-b"><CardTitle>Token overview</CardTitle></CardHeader>
          <CardContent><DataList items={[
            { label: "Contract address", value: data.contract.address, mono: true },
            { label: "Standard", value: token?.type ?? "Contract" },
            { label: "Name", value: token?.name ?? "—" },
            { label: "Symbol", value: token?.symbol ?? "—" },
            ...(token?.decimals !== undefined ? [{ label: "Decimals", value: token.decimals }] : []),
            ...(token?.totalSupply !== undefined ? [{ label: "Total supply", value: formatTokenAmount(token.totalSupply, token.decimals) }] : []),
            { label: "Contract code", value: `${data.contract.codeSize.toLocaleString()} bytes` },
            { label: "Contract balance (tCWN)", value: hexToEther(data.contract.balance) },
          ]} /></CardContent>
        </Card>
        <Card className="mt-6">
          <CardHeader className="border-b"><CardTitle>Recent transfers</CardTitle><p className="text-sm text-muted-foreground">Events in blocks {hexToNumber(data.fromBlock).toLocaleString()}–{hexToNumber(data.toBlock).toLocaleString()}. Older transfers require an index.</p></CardHeader>
          <CardContent>{data.transfers.length === 0 ? <EmptyState>No transfer events for this contract in the latest 10 blocks.</EmptyState> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2 font-medium">Transaction</th><th className="p-2 font-medium">Block</th><th className="p-2 font-medium">From</th><th className="p-2 font-medium">To</th><th className="p-2 text-right font-medium">Amount / event data</th></tr></thead><tbody>{data.transfers.map((log, i) => { const from = topicAddress(log.topics[1]); const to = topicAddress(log.topics[2]); const amount = token?.decimals !== undefined && /^0x[0-9a-fA-F]+$/.test(log.data) ? formatTokenAmount(BigInt(log.data).toString(), token.decimals) : shortenHex(log.data, 16, 12); return <tr key={`${log.transactionHash}-${log.logIndex ?? i}`} className="border-b last:border-0"><td className="p-2"><a className="font-mono text-xs text-primary hover:underline" href={`/tx/${log.transactionHash}`}>{shortenHex(log.transactionHash, 14, 10)}</a></td><td className="p-2"><a className="text-primary hover:underline" href={`/block/${hexToNumber(log.blockNumber)}`}>#{hexToNumber(log.blockNumber)}</a></td><td className="p-2 font-mono text-xs">{from ? <a className="text-primary hover:underline" href={`/address/${from}`}>{shortenHex(from)}</a> : "—"}</td><td className="p-2 font-mono text-xs">{to ? <a className="text-primary hover:underline" href={`/address/${to}`}>{shortenHex(to)}</a> : "—"}</td><td className="p-2 text-right font-mono text-xs">{amount}</td></tr>; })}</tbody></table></div>}</CardContent>
        </Card>
      </>}
    </>
  );
}

export const getServerSideProps = getPageProps;
