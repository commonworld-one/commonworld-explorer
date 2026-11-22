// Commonworld Testnet modifications/additions; see NOTICE.
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/Layout/PageHeader";
import { DataList } from "@/components/ui/DataList";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPageProps } from "@/lib/api.server";
import { errorMessage, postApi } from "@/lib/api";
import { formatTimestamp, hexToDecimal, hexToEther, hexToNumber, shortenHex } from "@/lib/format";
import type { PageProps } from "@/types/Config";
import type { AddressPageData } from "@/types/DetailPages";
import { useRouter } from "next/router";

function isAddress(value: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

export default function AddressPage({ config }: PageProps) {
  const router = useRouter();
  const address = typeof router.query.address === "string" ? router.query.address : "";
  const [data, setData] = useState<AddressPageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !address || !isAddress(address)) return;
    const controller = new AbortController();
    postApi<AddressPageData>("addressGetDetails", { rpcUrl: config.rpcUrl, address }, controller.signal)
      .then(setData)
      .catch((e) => !controller.signal.aborted && setError(errorMessage(e)));
    return () => controller.abort();
  }, [address, config.rpcUrl, router.isReady]);

  const isContract = !!data && data.code !== "0x";
  return (
    <>
      <PageHeader title="Address" description={address || "Account address"} />
      {!isAddress(address) && router.isReady ? <EmptyState>This address is not valid. Check the 0x address and try again.</EmptyState> : error ? <EmptyState>Could not load this address: {error}</EmptyState> : !data ? (
        <div className="space-y-2"><Skeleton className="h-10" /><Skeleton className="h-40" /></div>
      ) : <>
        <Card>
          <CardHeader className="border-b"><CardTitle>Address overview</CardTitle></CardHeader>
          <CardContent><DataList items={[
            { label: "Address", value: data.address, mono: true },
            { label: "Balance (tCWN)", value: hexToEther(data.balance) },
            { label: "Transaction count", value: hexToDecimal(data.nonce) },
            { label: "Type", value: isContract ? "Contract" : "Externally owned account" },
            ...(isContract ? [{ label: "Code size", value: `${Math.max(0, (data.code.length - 2) / 2).toLocaleString()} bytes` }] : []),
            ...(isContract ? [{ label: "Code", value: <pre className="max-h-36 overflow-auto rounded-md bg-muted p-3 font-mono text-xs break-all">{data.code}</pre>, mono: true }] : []),
          ]} /></CardContent>
        </Card>
        <Card className="mt-6">
          <CardHeader className="border-b"><CardTitle>Recent transactions</CardTitle><p className="text-sm text-muted-foreground">Activity in the latest 10 blocks ({hexToNumber(data.fromBlock).toLocaleString()}–{hexToNumber(data.toBlock).toLocaleString()}). Full historical address indexing is not present in the deployed Explorer.</p></CardHeader>
          <CardContent>{data.activity.length === 0 ? <EmptyState>No transactions involving this address were found in the latest 10 blocks.</EmptyState> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2 font-medium">Transaction</th><th className="p-2 font-medium">Block</th><th className="p-2 font-medium">From / To</th><th className="p-2 text-right font-medium">Value (tCWN)</th></tr></thead><tbody>{data.activity.map(({ transaction, timestamp }) => <tr key={transaction.hash} className="border-b last:border-0"><td className="p-2"><a className="font-mono text-xs text-primary hover:underline" href={`/tx/${transaction.hash}`}>{shortenHex(transaction.hash, 14, 10)}</a><div className="text-xs text-muted-foreground">{formatTimestamp(timestamp)}</div></td><td className="p-2"><a className="text-primary hover:underline" href={`/block/${hexToNumber(transaction.blockNumber)}`}>#{hexToNumber(transaction.blockNumber)}</a></td><td className="p-2 font-mono text-xs"><a className="text-primary hover:underline" href={`/address/${transaction.from}`}>{shortenHex(transaction.from)}</a> → {transaction.to ? <a className="text-primary hover:underline" href={`/address/${transaction.to}`}>{shortenHex(transaction.to)}</a> : "contract creation"}</td><td className="p-2 text-right tabular-nums">{hexToEther(transaction.value)}</td></tr>)}</tbody></table></div>}</CardContent>
        </Card>
      </>}
    </>
  );
}

export const getServerSideProps = getPageProps;
