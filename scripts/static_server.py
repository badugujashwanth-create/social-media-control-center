"""Serve the Next.js static export with clean route support for local demos."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).parents[1] / 'apps' / 'web' / 'out'


class CleanRouteHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = urlsplit(self.path).path
        if path != '/' and not Path(path).suffix:
            candidate = ROOT / f"{path.lstrip('/')}.html"
            if candidate.is_file():
                query = urlsplit(self.path).query
                self.path = f"{path}.html" + (f'?{query}' if query else '')
        super().do_GET()

    def log_message(self, _format, *_args):
        return


if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', 3100), CleanRouteHandler).serve_forever()
