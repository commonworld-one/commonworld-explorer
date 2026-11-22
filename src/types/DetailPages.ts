// Commonworld Testnet modifications/additions; see NOTICE.
import type { ContractDetails, Txn } from "@/types/Explorer";

export type RpcTransaction = Omit<Txn, "blockHash" | "blockNumber" | "transactionIndex"> & {
  blockHash: string | null;
  blockNumber: string | null;
  transactionIndex: string | null;
  type?: string;
};

export type RpcLog = {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
  transactionIndex?: string;
  logIndex?: string;
};

export type RpcReceipt = {
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  blockNumber: string;
  from: string;
  to: string | null;
  cumulativeGasUsed: string;
  gasUsed: string;
  effectiveGasPrice?: string;
  contractAddress: string | null;
  status: string | null;
  type?: string;
  logs: RpcLog[];
};

export type TransactionDetails = {
  transaction: RpcTransaction | null;
  receipt: RpcReceipt | null;
  blockTimestamp: string | null;
  latestBlock: string | null;
};
export type AddressPageData = {
  address: string;
  balance: string;
  nonce: string;
  code: string;
  activity: AddressActivity[];
  fromBlock: string;
  toBlock: string;
};
export type AddressActivity = { transaction: Txn; timestamp: string };
export type TokenDetails = { contract: ContractDetails; transfers: RpcLog[]; fromBlock: string; toBlock: string };
