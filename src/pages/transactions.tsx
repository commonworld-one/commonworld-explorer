// Commonworld Testnet modifications/additions; see NOTICE.
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BlockCountSelect } from "@/components/Explorer/BlockCountSelect";
import { SearchForm } from "@/components/Explorer/SearchForm";
import { TxnList } from "@/components/Explorer/TxnList";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { getPageProps } from "@/lib/api.server";
import { postApi } from "@/lib/api";
import { usePolling } from "@/lib/hooks";
import type { PageProps } from "@/types/Config";
import type { Block } from "@/types/Explorer";

export default function Transactions({ config }: PageProps) {
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [lookback, setLookback] = useState(10);
  const [now, setNow] = useState(() => Date.now());

  usePolling(
    async (signal) => {
      const recent = await postApi<Block[]>(
        "blocksGetRecent",
        { rpcUrl: config.rpcUrl, count: lookback },
        signal
      );
      setBlocks(recent);
      setNow(Date.now());
    },
    5000,
    [config.rpcUrl, lookback]
  );

  const rows = useMemo(
    () => (blocks ?? []).flatMap((b) => b.transactions.map((txn) => ({ txn, timestamp: b.timestamp }))),
    [blocks]
  );

  const searchTxn = async (hash: string) => {
    if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) {
      toast.error("Enter a valid 32-byte transaction hash");
      return;
    }
    window.location.assign(`/tx/${hash}`);
  };

  return (
    <>
      <PageHeader title="Transactions" description="Recent transactions seen by the node." />

      <Card>
        <CardHeader className="border-b max-sm:grid-cols-1">
          <CardTitle>Recent transactions</CardTitle>
          <CardDescription className="flex items-center gap-2 max-sm:col-start-1">
            <BlockCountSelect prefix="From the last" value={lookback} onChange={setLookback} />
          </CardDescription>
          <CardAction className="max-sm:col-start-1 max-sm:row-span-1 max-sm:row-start-3 max-sm:justify-self-stretch">
            <SearchForm label="Search by transaction hash" placeholder="Transaction hash (0x…)" onSearch={searchTxn} />
          </CardAction>
        </CardHeader>
        <CardContent>
          {blocks === null ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState>No transactions in the last {lookback} blocks.</EmptyState>
          ) : (
            <TxnList rows={rows} inset now={now} />
          )}
        </CardContent>
      </Card>
    </>
  );
}

export const getServerSideProps = getPageProps;
