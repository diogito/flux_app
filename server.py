from http.server import HTTPServer, SimpleHTTPRequestHandler
import sys

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable Cross-Origin Isolation for SharedArrayBuffer (Required for WebLLM/WebGPU)
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Access-Control-Allow-Origin', '*')
        SimpleHTTPRequestHandler.end_headers(self)

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8081
    print(f"Starting Flux Server with COOP/COEP on port {port}...")
    print(f"URL: http://localhost:{port}")
    HTTPServer(('', port), CORSRequestHandler).serve_forever()
