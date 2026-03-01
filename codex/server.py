#!/usr/bin/env python3
"""Local Codex static server with file-backed visitor log API.

Serves repository files and exposes:
  GET    /api/visitors
  POST   /api/visitors
  DELETE /api/visitors

Also supports the same API under /codex/api/visitors for root-served mode.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


REPO_ROOT = Path(__file__).resolve().parent.parent
CODEX_DIR = REPO_ROOT / "codex"
DATA_DIR = CODEX_DIR / "data"
DATA_FILE = DATA_DIR / "visitors.jsonl"
MAX_RECORDS = 5000
MAX_BODY_BYTES = 128_000
API_PATHS = {"/api/visitors", "/codex/api/visitors"}


def read_records() -> list[dict]:
    if not DATA_FILE.exists():
        return []

    records: list[dict] = []
    with DATA_FILE.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(entry, dict):
                records.append(entry)
    return records


def write_records(records: list[dict]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with DATA_FILE.open("w", encoding="utf-8") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=True))
            handle.write("\n")


def trim_records(records: list[dict], limit: int) -> list[dict]:
    if len(records) <= limit:
        return records
    return records[-limit:]


class CodexHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(REPO_ROOT), **kwargs)

    def _request_path(self) -> str:
        parsed = urlparse(self.path)
        return parsed.path.rstrip("/") or "/"

    def _is_api_request(self) -> bool:
        return self._request_path() in API_PATHS

    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=True).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _send_method_not_allowed(self) -> None:
        self.send_response(405)
        self.send_header("Allow", "GET, POST, DELETE, OPTIONS")
        self.end_headers()

    def do_OPTIONS(self) -> None:  # noqa: N802
        if not self._is_api_request():
            self._send_method_not_allowed()
            return
        self.send_response(204)
        self.send_header("Allow", "GET, POST, DELETE, OPTIONS")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if not self._is_api_request():
            super().do_GET()
            return

        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        try:
            requested_limit = int(query.get("limit", ["1000"])[0])
        except (TypeError, ValueError):
            requested_limit = 1000
        limit = max(1, min(requested_limit, MAX_RECORDS))

        all_records = read_records()
        sliced = trim_records(all_records, limit)
        sliced.reverse()

        self._send_json(
            200,
            {
                "records": sliced,
                "count": len(all_records),
                "stored_file": "codex/data/visitors.jsonl",
            },
        )

    def do_POST(self) -> None:  # noqa: N802
        if not self._is_api_request():
            self._send_method_not_allowed()
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0

        if length <= 0:
            self._send_json(400, {"error": "empty request body"})
            return

        if length > MAX_BODY_BYTES:
            self._send_json(413, {"error": "payload too large"})
            return

        raw = self.rfile.read(length)
        try:
            incoming = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._send_json(400, {"error": "invalid json"})
            return

        if not isinstance(incoming, dict):
            self._send_json(400, {"error": "expected json object"})
            return

        record = dict(incoming)
        record["serverRecordedAt"] = datetime.now(timezone.utc).isoformat()

        records = read_records()
        records.append(record)
        records = trim_records(records, MAX_RECORDS)
        write_records(records)

        self._send_json(
            201,
            {"ok": True, "stored": len(records), "stored_file": "codex/data/visitors.jsonl"},
        )

    def do_DELETE(self) -> None:  # noqa: N802
        if not self._is_api_request():
            self._send_method_not_allowed()
            return

        write_records([])
        self._send_json(200, {"ok": True, "stored": 0, "stored_file": "codex/data/visitors.jsonl"})


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve site with Codex visitor API.")
    parser.add_argument("--host", default="127.0.0.1", help="Bind host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8080, help="Bind port (default: 8080)")
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), CodexHandler)
    print(f"Serving {REPO_ROOT} at http://{args.host}:{args.port}")
    print("Visitor API:")
    print(f"  http://{args.host}:{args.port}/api/visitors")
    print(f"  http://{args.host}:{args.port}/codex/api/visitors")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
