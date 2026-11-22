// Commonworld Testnet modifications/additions; see NOTICE.
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/Layout/PageHeader";
import { DataList } from "@/components/ui/DataList";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPageProps } from "@/lib/api.server";
import { errorMessage, postApi } from "@/lib/api";
import { formatTimestamp, gasUsedPercent, hexToDecimal, hexToEther, hexToNumber, shortenHex } from "@/lib/format";
import type { PageProps } from "@/types/Config";
import type { Block } from "@/types/Explorer";
import { useRouter } from "next/router";

export default function BlockPage({ config }: PageProps) {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const [block, setBlock] = useState<Block | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !id) return;
    const controller = new AbortController();
    postApi<Block | null>("blockGetById", { rpcUrl: config.rpcUrl, id }, controller.signal)
      .then(setBlock)
      .catch((e) => !controller.signal.aborted && setError(errorMessage(e)));
    return () => controller.abort();
  }, [config.rpcUrl, id, router.isReady]);

  const isHeight = /^(?:\d+|0x[0-9a-fA-F]+)$/.test(id);
  return (
    <>
      <PageHeader title={block ? `Block #${hexToNumber(block.number).toLocaleString()}` : "Block"} description={id || "Block height or hash"} />
      {!id || (!isHeight && !/^0x[0-9a-fA-F]{64}$/.test(id)) ? <EmptyState>Enter a block number or a 32-byte block hash.</EmptyState> : error ? <EmptyState>Could not load this block: {error}</EmptyState> : block === undefined ? (
        <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-48" /></div>
      ) : !block ? <EmptyState>Block not found.</EmptyState> : <>
        <Card>
          <CardHeader className="border-b"><CardTitle>Block details</CardTitle></CardHeader>
          <CardContent><DataList items={[
            { label: "Height", value: `#${hexToNumber(block.number).toLocaleString()}` },
            { label: "Hash", value: block.hash, mono: true },
            { label: "Parent hash", value: block.parentHash, mono: true },
            { label: "Timestamp", value: formatTimestamp(block.timestamp) },
            { label: "Proposer", value: <a className="font-mono text-primary hover:underline" href={`/address/${block.miner}`}>{block.miner}</a> },
            { label: "Transactions", value: block.transactions.length.toLocaleString() },
            { label: "Gas used / limit", value: `${hexToDecimal(block.gasUsed)} / ${hexToDecimal(block.gasLimit)} (${gasUsedPercent(block.gasUsed, block.gasLimit).toFixed(1)}%)` },
            { label: "Size", value: `${hexToDecimal(block.size)} bytes` },
            { label: "State root", value: block.stateRoot, mono: true },
            { label: "Receipts root", value: block.receiptsRoot, mono: true },
            { label: "Transactions root", value: block.transactionsRoot, mono: true },
          ]} /></CardContent>
        </Card>
        <Card className="mt-6">
          <CardHeader className="border-b"><CardTitle>Transactions ({block.transactions.length})</CardTitle></CardHeader>
          <CardContent>{block.transactions.length === 0 ? <EmptyState>No transactions in this block.</EmptyState> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2 font-medium">Transaction</th><th className="p-2 font-medium">From</th><th className="p-2 font-medium">To</th><th className="p-2 text-right font-medium">Value (tCWN)</th></tr></thead><tbody>{block.transactions.map((txn) => <tr key={txn.hash} className="border-b last:border-0"><td className="p-2"><a className="font-mono text-xs text-primary hover:underline" href={`/tx/${txn.hash}`}>{shortenHex(txn.hash, 14, 10)}</a></td><td className="p-2 font-mono text-xs"><a className="text-primary hover:underline" href={`/address/${txn.from}`}>{shortenHex(txn.from)}</a></td><td className="p-2 font-mono text-xs">{txn.to ? <a className="text-primary hover:underline" href={`/address/${txn.to}`}>{shortenHex(txn.to)}</a> : "contract creation"}</td><td className="p-2 text-right tabular-nums">{hexToEther(txn.value)}</td></tr>)}</tbody></table></div>}</CardContent>
        </Card>
      </>}
    </>
  );
}

export const getServerSideProps = getPageProps;
