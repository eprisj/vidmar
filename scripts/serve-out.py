"""Serve the static export (out/) the way nginx does on the VPS: /book finds
book.html. Threaded, because the single-threaded http.server stalls a page
with a dozen assets mid-load. Port 3000 is in the API's ALLOWED_ORIGINS."""
import os
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "out")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def translate_path(self, path):
        p = super().translate_path(path).rstrip("/")
        # out/cart/ is a folder of RSC payloads next to out/cart.html
        if os.path.exists(p + ".html"):
            return p + ".html"
        return p

    def send_head(self):
        # never redirect /cart to /cart/: the page is cart.html
        bare = self.path.split("?")[0].rstrip("/")
        if bare and os.path.exists(os.path.join(ROOT, bare.lstrip("/") + ".html")):
            self.path = bare + ".html" + (self.path[len(self.path.split("?")[0]):])
        return super().send_head()

    def log_message(self, *a):
        pass


ThreadingHTTPServer(("localhost", 3000), Handler).serve_forever()
