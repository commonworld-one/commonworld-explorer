// Commonworld Testnet modifications/additions; see NOTICE.
export type NodeDetails = {
  online: boolean;
  nodeId: string;
  nodeName: string;
  blocks: number;
  peers: number;
  pendingTxns: number;
};

export type Peer = {
  id: string;
  name: string;
};
