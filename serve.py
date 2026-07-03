#!/usr/bin/env python3
"""Lokální server pro web Reality Kostarika (export CostaGit).

Web používá cesty s prefixem /costa/ (stejně jako GitHub Pages).
Otevřete: http://127.0.0.1:8000/costa/

Spuštění:
  python3 serve.py              # jen tento počítač (127.0.0.1)
  python3 serve.py --lan        # i telefon v síti / hotspotu
  python3 serve.py --lan 8080   # vlastní port
"""
from __future__ import annotations

import argparse
import socket
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, urlunparse

SITE_DIR = Path(__file__).resolve().parent
DEFAULT_PORT = 8000
BASE_PREFIX = "/costa"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE_DIR), **kwargs)

    def send_head(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path in ("", "/"):
            self.send_response(302)
            self.send_header("Location", f"{BASE_PREFIX}/")
            self.end_headers()
            return None

        if path == BASE_PREFIX:
            path = f"{BASE_PREFIX}/"

        if path == f"{BASE_PREFIX}/":
            path = f"{BASE_PREFIX}/index.html"

        if path.startswith(f"{BASE_PREFIX}/"):
            path = path[len(BASE_PREFIX) :] or "/"

        if path != "/" and "." not in path.rsplit("/", 1)[-1]:
            candidate = SITE_DIR / (path.lstrip("/") + ".html")
            if candidate.exists():
                path = path.rstrip("/") + ".html"

        self.path = urlunparse((parsed.scheme, parsed.netloc, path, parsed.params, parsed.query, parsed.fragment))
        return super().send_head()


def lan_ips() -> list[str]:
    ips: set[str] = set()

    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("10.255.255.255", 1))
            ips.add(sock.getsockname()[0])
    except OSError:
        pass

    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ip = info[4][0]
            if not ip.startswith("127."):
                ips.add(ip)
    except socket.gaierror:
        pass

    return sorted(ips)


def print_urls(host: str, port: int) -> None:
    print(f"Web běží na http://127.0.0.1:{port}{BASE_PREFIX}/", flush=True)
    print("Tip: pokud port 8000 obsazený, ukončete starý server (Ctrl+C) nebo použijte jiný port.", flush=True)

    if host != "127.0.0.1":
        print("Test na telefonu (stejná Wi-Fi / hotspot):", flush=True)
        for ip in lan_ips():
            print(f"  http://{ip}:{port}{BASE_PREFIX}/", flush=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Lokální server pro web Reality Kostarika.")
    parser.add_argument(
        "--lan",
        action="store_true",
        help="naslouchat v celé síti (0.0.0.0) — pro test na telefonu",
    )
    parser.add_argument(
        "port",
        nargs="?",
        type=int,
        default=DEFAULT_PORT,
        help=f"port (výchozí {DEFAULT_PORT})",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    host = "0.0.0.0" if args.lan else "127.0.0.1"
    print_urls(host, args.port)

    try:
        ThreadingHTTPServer((host, args.port), Handler).serve_forever()
    except OSError as exc:
        print(f"Server se nespustil: {exc}", file=sys.stderr)
        if "Address already in use" in str(exc):
            print(f"Port {args.port} je obsazený. Zkuste: python3 serve.py {args.port + 1}", file=sys.stderr)
        sys.exit(1)
