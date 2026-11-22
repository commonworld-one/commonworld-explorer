#!/usr/bin/env python3
"""Small public-facing Explorer adapter. Besu and the internal Explorer RPC stay private."""

from http.client import HTTPConnection
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import json
import os
import re
import sys


HOST = "127.0.0.1"
PORT = int(os.environ.get("LISTEN_PORT", "25000"))
UPSTREAM_HOST = os.environ.get("UPSTREAM_HOST", "127.0.0.1")
UPSTREAM_PORT = int(os.environ.get("UPSTREAM_PORT", "25001"))
PUBLIC_RPC_URL = os.environ.get("PUBLIC_RPC_URL", "https://rpc-testnet.commonworld.one")
# Set only in the server-side unit. This value must never be serialized to a browser.
EXPLORER_INTERNAL_RPC_URL = os.environ.get("EXPLORER_INTERNAL_RPC_URL", "")
MAX_REQUEST_BODY = 4 * 1024 * 1024
HERE = Path(__file__).resolve().parent
TX_PAGE = (HERE / "explorer-transaction.html").read_bytes()

HOP_BY_HOP = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailer", "trailers", "transfer-encoding", "upgrade",
}

HTML_REPLACEMENTS = (
    (b"Send ETH from your browser wallet.", b"Send tCWN from your browser wallet."),
    (b"Transfer ETH", b"Transfer tCWN"),
    (b"Balance (ETH)", b"Balance (tCWN)"),
    (b"Balance (Ether)", b"Balance (tCWN)"),
    (b"ETH Balance", b"tCWN Balance"),
    (b"Ether Balance", b"tCWN Balance"),
    (b"Amount (ETH)", b"Amount (tCWN)"),
    (b"Amount (Ether)", b"Amount (tCWN)"),
    (b"Value (ETH)", b"Value (tCWN)"),
    (b"Value (Ether)", b"Value (tCWN)"),
)

JS_REPLACEMENTS = HTML_REPLACEMENTS + (
    (b'" ETH"', b'" tCWN"'),
    (b'name:"Ether",symbol:"ETH",decimals:18', b'name:"Test Commonworld",symbol:"tCWN",decimals:18'),
    (b'chainName:`Besu ${BigInt(l).toString()}`', b'chainName:"Commonworld Testnet"'),
)

DISPLAY_RPC_PATCH = r'''<script id="cwn-display-rpc-url">
(() => {
  const publicUrl = "https://rpc-testnet.commonworld.one";
  const update = () => {
    for (const label of document.querySelectorAll("dt")) {
      if (label.textContent.trim() !== "RPC URL") continue;
      const value = label.nextElementSibling;
      if (value && value.tagName === "DD" && value.textContent.trim() !== publicUrl) {
        value.textContent = publicUrl;
      }
    }
  };
  const start = () => {
    update();
    new MutationObserver(update).observe(document.body, {
      childList: true, subtree: true, characterData: true
    });
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
</script>'''.encode()

EXPLORER_DATA_STATUS_PATCH = r'''<script id="cwn-explorer-data-status">
(() => {
  if (window.__cwnExplorerDataStatusPatched) return;
  window.__cwnExplorerDataStatusPatched = true;
  const apiPath = "/explorer/api/blocksGetRecent";
  const originalFetch = window.fetch.bind(window);
  const pageKind = () => {
    const path = window.location.pathname;
    if (path.endsWith("/explorer/transactions")) return "transactions";
    if (path.endsWith("/explorer/blocks")) return "blocks";
    return null;
  };
  const showStatus = (state, message) => {
    const kind = pageKind();
    if (!kind) return;
    const main = document.querySelector("main") || document.body;
    let status = document.getElementById("cwn-explorer-data-status-message");
    if (!status) {
      status = document.createElement("div");
      status.id = "cwn-explorer-data-status-message";
      status.setAttribute("aria-live", "polite");
      status.style.cssText = "margin:16px 0;padding:12px 16px;border:1px solid #b8c7d9;border-radius:8px;background:#f4f8fc;color:#19324d";
      const heading = main.querySelector("h1");
      if (heading && heading.parentNode) heading.parentNode.insertBefore(status, heading.nextSibling);
      else main.prepend(status);
    }
    status.dataset.state = state;
    status.setAttribute("role", state === "error" ? "alert" : "status");
    status.textContent = message;
  };
  const clearStatus = () => {
    const status = document.getElementById("cwn-explorer-data-status-message");
    if (status) status.remove();
  };
  const originalPath = window.location.pathname;
  const originalPushState = history.pushState.bind(history);
  history.pushState = (...args) => {
    const result = originalPushState(...args);
    if (window.location.pathname !== originalPath) clearStatus();
    return result;
  };
  window.fetch = async (...args) => {
    const input = args[0];
    const rawUrl = typeof input === "string" ? input : (input && input.url) || String(input);
    const url = new URL(rawUrl, window.location.href);
    const kind = pageKind();
    if (url.pathname !== apiPath || !kind) return originalFetch(...args);
    try {
      const response = await originalFetch(...args);
      if (!response.ok) {
        const label = kind === "transactions" ? "transaction range" : "block list";
        showStatus("error", `Could not load the ${label} (HTTP ${response.status}). Retry the page.`);
        return response;
      }
      let rows;
      try { rows = await response.clone().json(); }
      catch { showStatus("error", "Explorer returned an unreadable block response."); return response; }
      if (!Array.isArray(rows)) {
        showStatus("error", "Explorer returned an invalid block response.");
        return response;
      }
      if (kind === "transactions") {
        const transactions = rows.flatMap(block => Array.isArray(block?.transactions) ? block.transactions : []);
        if (transactions.length === 0) showStatus("empty", "No transactions found in the selected block range. The range query succeeded.");
        else clearStatus();
      } else if (rows.length === 0) {
        showStatus("empty", "No blocks were returned for this selection.");
      } else {
        clearStatus();
      }
      return response;
    } catch (error) {
      const label = kind === "transactions" ? "transaction range" : "block list";
      showStatus("error", `Could not load the ${label}. The Explorer API request failed.`);
      throw error;
    }
  };
})();
</script>'''.encode()

SCRIPT_CACHE_BUSTER = re.compile(
    rb'((?:src|href)="[^"]*/_next/static/chunks/[^"]+\.js)(\?[^"]*)?(")'
)


def rewrite_html(body: bytes) -> bytes:
    for before, after in HTML_REPLACEMENTS:
        body = body.replace(before, after)
    body = rewrite_browser_rpc_url(body)
    body = SCRIPT_CACHE_BUSTER.sub(rb'\1?cwn-ui=20261119-v2\3', body)
    closing = b"</body>"
    if closing in body:
        patches = b""
        if b"cwn-display-rpc-url" not in body:
            patches += DISPLAY_RPC_PATCH
        if b"cwn-explorer-data-status" not in body:
            patches += EXPLORER_DATA_STATUS_PATCH
        if patches:
            body = body.replace(closing, patches + closing, 1)
    return body


def rewrite_javascript(body: bytes) -> bytes:
    for before, after in JS_REPLACEMENTS:
        body = body.replace(before, after)
    return rewrite_browser_rpc_url(body)


def rewrite_browser_rpc_url(body: bytes) -> bytes:
    """Replace internal RPC references in payloads returned to browsers."""
    if not EXPLORER_INTERNAL_RPC_URL:
        return body
    internal = EXPLORER_INTERNAL_RPC_URL.encode()
    public = PUBLIC_RPC_URL.encode()
    body = body.replace(internal, public)
    body = body.replace(internal.replace(b"/", b"\\/"), public.replace(b"/", b"\\/"))
    return body


def rewrite_api_request_body(path: str, body: bytes) -> bytes:
    """Pin browser-originated Explorer API calls to the server-side RPC URL."""
    if not EXPLORER_INTERNAL_RPC_URL or not body:
        return body
    if not urlsplit(path).path.startswith("/explorer/api/"):
        return body
    try:
        payload = json.loads(body)
    except (UnicodeDecodeError, json.JSONDecodeError):
        return body

    changed = False

    def pin_rpc_url(value):
        nonlocal changed
        if isinstance(value, dict):
            for key, item in value.items():
                if key == "rpcUrl" and isinstance(item, str):
                    value[key] = EXPLORER_INTERNAL_RPC_URL
                    changed = True
                else:
                    pin_rpc_url(item)
        elif isinstance(value, list):
            for item in value:
                pin_rpc_url(item)

    pin_rpc_url(payload)
    if not changed:
        return body
    return json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode()


class ExplorerPublicProxy(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "CommonworldExplorerProxy"
    sys_version = ""

    def log_message(self, fmt, *args):
        # Avoid logging request bodies, cookies, or wallet data.
        sys.stderr.write("explorer-proxy: " + (fmt % args) + "\n")

    def _send_transaction_page(self, head_only=False):
        body = TX_PAGE.replace(b"__PUBLIC_RPC_URL__", PUBLIC_RPC_URL.encode())
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Content-Security-Policy", "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src https://rpc-testnet.commonworld.one; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
        self.send_header("Connection", "close")
        self.end_headers()
        if not head_only:
            self.wfile.write(body)
        self.close_connection = True

    def _proxy(self, head_only=False):
        parsed = urlsplit(self.path)
        if parsed.path == "/_cwn_health":
            payload = b"ok\n"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            if not head_only:
                self.wfile.write(payload)
            return

        if parsed.path == "/tx" or parsed.path.startswith("/tx/"):
            return self._send_transaction_page(head_only)

        content_length = int(self.headers.get("Content-Length", "0") or "0")
        if content_length < 0 or content_length > MAX_REQUEST_BODY:
            payload = b'{"error":"request body exceeds 4 MiB"}'
            self.send_response(413)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(payload)
            return
        request_body = self.rfile.read(content_length) if content_length else None
        if request_body is not None:
            request_body = rewrite_api_request_body(self.path, request_body)

        request_headers = {}
        for name, value in self.headers.items():
            if name.lower() in HOP_BY_HOP or name.lower() in {"accept-encoding", "if-none-match", "if-modified-since"}:
                continue
            request_headers[name] = value
        request_headers["Host"] = self.headers.get("Host", "explorer-testnet.commonworld.one")
        request_headers["X-Forwarded-Host"] = self.headers.get("Host", "explorer-testnet.commonworld.one")
        request_headers["X-Forwarded-Proto"] = "https"
        request_headers["Accept-Encoding"] = "identity"
        if request_body is not None:
            request_headers["Content-Length"] = str(len(request_body))

        upstream_path = self.path
        conn = HTTPConnection(UPSTREAM_HOST, UPSTREAM_PORT, timeout=45)
        try:
            conn.request(self.command, upstream_path, body=request_body, headers=request_headers)
            upstream_response = conn.getresponse()
            body = b"" if head_only else upstream_response.read()
            response_headers = upstream_response.getheaders()
            status = upstream_response.status
        except Exception:
            payload = b"Explorer is temporarily unavailable. Please retry shortly."
            self.send_response(502)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            if not head_only:
                self.wfile.write(payload)
            return
        finally:
            conn.close()

        content_type = next((v for k, v in response_headers if k.lower() == "content-type"), "")
        changed = False
        if not head_only and "text/html" in content_type.lower():
            rewritten = rewrite_html(body)
            changed = rewritten != body
            body = rewritten
        elif not head_only and ("javascript" in content_type.lower() or parsed.path.endswith(".js")):
            rewritten = rewrite_javascript(body)
            changed = rewritten != body
            body = rewritten
        elif not head_only and ("json" in content_type.lower() or "text/" in content_type.lower()):
            rewritten = rewrite_browser_rpc_url(body)
            changed = rewritten != body
            body = rewritten

        self.send_response(status)
        for name, value in response_headers:
            lower = name.lower()
            if lower in HOP_BY_HOP or lower in {"content-length", "etag", "last-modified"}:
                continue
            if changed and lower == "content-encoding":
                continue
            if changed and lower == "cache-control":
                continue
            self.send_header(name, value)
        self.send_header("Content-Length", str(len(body)))
        if changed:
            self.send_header("Cache-Control", "no-cache, must-revalidate")
        self.send_header("Connection", "close")
        self.end_headers()
        if not head_only:
            self.wfile.write(body)
        self.close_connection = True

    def do_GET(self):
        self._proxy()

    def do_HEAD(self):
        self._proxy(head_only=True)

    def do_POST(self):
        self._proxy()

    def do_OPTIONS(self):
        self._proxy()


class Server(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == "__main__":
    server = Server((HOST, PORT), ExplorerPublicProxy)
    print(f"Listening on {HOST}:{PORT}; Explorer upstream {UPSTREAM_HOST}:{UPSTREAM_PORT}", flush=True)
    server.serve_forever()
