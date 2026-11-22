// Commonworld Testnet modifications/additions; see NOTICE.
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/Layout/PageHeader";
import { DataList } from "@/components/ui/DataList";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getPageProps } from "@/lib/api.server";
import { errorMessage, postApi } from "@/lib/api";
import { formatTimestamp, hexToDecimal, hexToEther, hexToNumber, shortenHex } from "@/lib/format";
import type { PageProps } from "@/types/Config";
import type { TransactionDetails } from "@/types/DetailPages";
import { useRouter } from "next/router";

function isHash(value: string) {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

export default function TransactionPage({ config }: PageProps) {
  const router = useRouter();
  const hash = typeof router.query.hash === "string" ? router.query.hash : "";
  const [data, setData] = useState<TransactionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !hash || !isHash(hash)) return;
    const controller = new AbortController();
    postApi<TransactionDetails>("txnGetDetails", { rpcUrl: config.rpcUrl, hash }, controller.signal)
      .then(setData)
      .catch((e) => !controller.signal.aborted && setError(errorMessage(e)));
    return () => controller.abort();
  }, [config.rpcUrl, hash, router.isReady]);

  const txn = data?.transaction;
  const receipt = data?.receipt;
  const fee = receipt?.gasUsed && receipt.effectiveGasPrice
    ? (BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice)).toString()
    : null;
  const confirmations = txn?.blockNumber && data?.latestBlock
    ? Math.max(0, hexToNumber(data.latestBlock) - hexToNumber(txn.blockNumber))
    : null;

  return (
    <>
      <PageHeader title="Transaction" description={hash || "Transaction hash"} />
      {!isHash(hash) && router.isReady ? (
        <EmptyState>That transaction hash is not valid. Check the link and try again.</EmptyState>
      ) : error ? (
        <EmptyState>Could not load this transaction: {error}</EmptyState>
      ) : !data ? (
        <div className="space-y-2"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
      ) : !txn ? (
        <EmptyState>Transaction not found. It may not be included in the chain yet.</EmptyState>
      ) : (
        <>
          <Card>
            <CardHeader className="border-b"><CardTitle>Transaction overview</CardTitle></CardHeader>
            <CardContent>
              <DataList items={[
                { label: "Hash", value: txn.hash, mono: true },
                { label: "Status", value: receipt?.status === "0x1" ? <StatusBadge tone="success">Success</StatusBadge> : receipt?.status === "0x0" ? <StatusBadge tone="danger">Failed</StatusBadge> : <StatusBadge tone="warning">Pending</StatusBadge> },
                { label: "Block", value: txn.blockNumber ? <a className="text-primary hover:underline" href={`/block/${hexToNumber(txn.blockNumber)}`}>#{hexToNumber(txn.blockNumber)}</a> : "Pending" },
                { label: "Block hash", value: txn.blockHash ?? "—", mono: true },
                ...(data.blockTimestamp ? [{ label: "Timestamp", value: formatTimestamp(data.blockTimestamp) }] : []),
                ...(confirmations !== null ? [{ label: "Confirmations", value: confirmations.toLocaleString() }] : []),
                { label: "From", value: <a className="font-mono text-primary hover:underline" href={`/address/${txn.from}`}>{txn.from}</a> },
                { label: "To", value: txn.to ? <a className="font-mono text-primary hover:underline" href={`/address/${txn.to}`}>{txn.to}</a> : receipt?.contractAddress ? <a className="font-mono text-primary hover:underline" href={`/address/${receipt.contractAddress}`}>{receipt.contractAddress} (created)</a> : "Contract creation" },
                { label: "Value (tCWN)", value: hexToEther(txn.value) },
                { label: "Gas limit", value: hexToDecimal(txn.gas) },
                ...(receipt ? [{ label: "Gas used", value: hexToDecimal(receipt.gasUsed) }] : []),
                ...(receipt?.effectiveGasPrice ? [{ label: "Effective gas price", value: `${hexToDecimal(receipt.effectiveGasPrice)} wei` }] : []),
                ...(fee !== null ? [{ label: "Transaction fee", value: `${hexToEther(fee)} tCWN` }] : []),
                { label: "Nonce", value: hexToDecimal(txn.nonce) },
                { label: "Transaction index", value: txn.transactionIndex ? hexToDecimal(txn.transactionIndex) : "—" },
                ...(txn.type ? [{ label: "Type", value: hexToDecimal(txn.type) }] : []),
              ]} />
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader className="border-b"><CardTitle>Input data</CardTitle></CardHeader>
            <CardContent><pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap break-all">{txn.input || "0x"}</pre></CardContent>
          </Card>
          {receipt && <Card className="mt-6">
            <CardHeader className="border-b"><CardTitle>Logs ({receipt.logs.length})</CardTitle></CardHeader>
            <CardContent className="space-y-3">{receipt.logs.length === 0 ? <EmptyState>No event logs in this receipt.</EmptyState> : receipt.logs.map((log, i) => <div key={`${log.logIndex}-${i}`} className="rounded-md border p-3"><p className="font-mono text-xs"><a className="text-primary hover:underline" href={`/address/${log.address}`}>{log.address}</a></p><p className="mt-2 break-all font-mono text-xs text-muted-foreground">{log.topics.join(" · ")}</p><p className="mt-2 break-all font-mono text-xs">{shortenHex(log.data, 24, 16)}</p></div>)}</CardContent>
          </Card>}
        </>
      )}
    </>
  );
}

export const getServerSideProps = getPageProps;
