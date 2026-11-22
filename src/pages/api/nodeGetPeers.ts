// Commonworld Testnet modifications/additions; see NOTICE.
import { apiRoute } from "@/lib/api.server";
import { ethApiCall } from "@/lib/rpc";
import { requireString } from "@/lib/validate";
import type { Peer } from "@/types/Nodes";

type AdminPeer = {
  id: string;
  name: string;
};

export default apiRoute<Peer[]>(async (body) => {
  const peers = await ethApiCall<AdminPeer[]>(requireString(body, "rpcUrl"), "admin_peers");
  return peers.map((p) => ({
    id: p.id,
    name: p.name,
  }));
});
