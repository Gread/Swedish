#!/usr/bin/env python3
"""Local server for the Omarchy extension.

Serves the built app (dist/) to the scene window and keeps the progress in a
file, so the bar panel and the hourly reminder can read it too:

  GET  /api/progress  the app's persisted progress (zustand "swedish-progress")
  PUT  /api/progress  replace it; also records today in the activity log
  GET  /api/theme     colours of the current Omarchy theme

Listens on 127.0.0.1 only. Uses the standard library only.
"""

import json
import os
import re
import sys
import tempfile
from datetime import date
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
STATE = Path(os.environ.get("XDG_STATE_HOME", Path.home() / ".local/state")) / "swedish"
PROGRESS = STATE / "progress.json"
ACTIVITY = STATE / "activity.json"
THEME = Path(os.environ.get("XDG_STATE_HOME", Path.home() / ".local/state")) / "omarchy/current/theme/colors.toml"
PORT = int(os.environ.get("SWEDISH_PORT", "47823"))
MAX_BODY = 4 * 1024 * 1024


def write_atomic(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=path.name, suffix=".tmp")
    with os.fdopen(fd, "w") as f:
        f.write(text)
    os.replace(tmp, path)


def record_activity() -> None:
    """Days with at least one card built or reviewed, for the streak."""
    try:
        days = json.loads(ACTIVITY.read_text()).get("days", [])
    except (OSError, ValueError):
        days = []
    today = date.today().isoformat()
    if today not in days:
        days = sorted(set(days + [today]))[-400:]
        write_atomic(ACTIVITY, json.dumps({"days": days}))


def card_timestamps(raw: str) -> dict:
    """{card id: last built/reviewed timestamp} from a persisted progress blob."""
    try:
        cards = json.loads(raw).get("state", {}).get("cards", {})
    except (ValueError, AttributeError):
        return {}
    return {
        k: max(v.get("builtAt") or 0, v.get("ultimaRevisao") or 0)
        for k, v in cards.items()
        if isinstance(v, dict)
    }


def theme() -> dict:
    colors = {}
    try:
        for line in THEME.read_text().splitlines():
            m = re.match(r'^\s*([a-z_]+)\s*=\s*"([^"]*)"', line)
            if m:
                colors[m.group(1)] = m.group(2)
    except OSError:
        pass
    return colors


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def log_message(self, format, *args):  # quiet: the journal only needs errors
        pass

    def send_json(self, body: str, status=HTTPStatus.OK):
        data = body.encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def end_headers(self):
        # index.html and cards.json change with every build; the hashed assets don't.
        if self.path.split("?")[0] in ("/", "/index.html", "/cards.json"):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/api/progress":
            try:
                return self.send_json(PROGRESS.read_text())
            except OSError:
                return self.send_json("null")
        if path == "/api/theme":
            return self.send_json(json.dumps(theme()))
        return super().do_GET()

    def do_PUT(self):
        if self.path.split("?")[0] != "/api/progress":
            return self.send_error(HTTPStatus.NOT_FOUND)
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BODY:
            return self.send_error(HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
        raw = self.rfile.read(length).decode("utf-8", "replace")
        try:
            json.loads(raw)
        except ValueError:
            return self.send_error(HTTPStatus.BAD_REQUEST)
        try:
            before = card_timestamps(PROGRESS.read_text())
        except OSError:
            before = {}
        write_atomic(PROGRESS, raw)
        # Only a card built or reviewed (a newer timestamp) counts as a day of
        # practice; the app also saves when it merely loads.
        after = card_timestamps(raw)
        if any(t > before.get(k, 0) for k, t in after.items()):
            record_activity()
        self.send_json('{"ok":true}')


def main():
    if not (DIST / "index.html").exists():
        sys.exit(f"build the app first: {DIST}/index.html is missing (npm run build:omarchy)")
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    server.daemon_threads = True
    server.serve_forever()


if __name__ == "__main__":
    main()
