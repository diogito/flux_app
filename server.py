from http.server import HTTPServer, SimpleHTTPRequestHandler
import sys

import json
import os
import urllib.request

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable Cross-Origin Isolation for SharedArrayBuffer (Required for WebLLM/WebGPU)
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Access-Control-Allow-Origin', '*')
        SimpleHTTPRequestHandler.end_headers(self)

    def do_POST(self):
        if self.path == '/api/neural-bridge':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            # -- REAL CLOUD INTELLIGENCE (OpenAI Proxy) --
            api_key = os.environ.get("OPENAI_API_KEY")
            
            if not api_key:
                # Fail loud if no key (User requested "Real AI")
                self.send_error(500, "Missing OPENAI_API_KEY environment variable. Please export it to use Real Cloud AI.")
                return

            try:
                # Construct Prompt
                energy = data.get('energy_level', 50)
                tags = data.get('semantic_tags', [])
                note = data.get('journal_note', '')
                history = data.get('history_context', 'No history.')
                
                system_prompt = """
                You are Flux, an advanced behavioral psychologist AI. 
                Analyze the user's biological energy and history to decide the optimal "Operating Mode".
                
                Modes:
                - Survival (<30%): Minimal effort.
                - Maintenance (30-70%): Consistency.
                - Expansion (>70%): Deep work.

                Output JSON ONLY:
                {
                    "context": "survival|maintenance|expansion",
                    "reasoning": "Brief psychological analysis (max 1 sentence). Cite history if relevant.",
                    "actionable_tip": "One specific micro-habit."
                }
                """
                
                user_msg = f"""
                Energy: {energy}%
                Tags: {', '.join(tags)}
                Note: "{note}"
                History: {history}
                """

                # Call OpenAI API
                req = urllib.request.Request(
                    "https://api.openai.com/v1/chat/completions",
                    data=json.dumps({
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_msg}
                        ],
                        "temperature": 0.7,
                        "response_format": { "type": "json_object" }
                    }).encode('utf-8'),
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}"
                    },
                    method="POST"
                )

                with urllib.request.urlopen(req) as f:
                    response_body = f.read().decode('utf-8')
                    openai_data = json.loads(response_body)
                    ai_content = json.loads(openai_data['choices'][0]['message']['content'])
                    
                    # Normalize Response
                    final_response = {
                        "status": "success",
                        "model_used": openai_data['model'],
                        "analysis": {
                            "context": ai_content.get('context', 'maintenance'),
                            "reasoning": ai_content.get('reasoning', 'Analysis complete.'),
                            "actionable_tip": ai_content.get('actionable_tip', 'Keep going.')
                        }
                    }

                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(final_response).encode('utf-8'))

            except Exception as e:
                print(f"OpenAI Error: {e}")
                self.send_error(502, f"Cloud AI Provider Error: {str(e)}")

        else:
            self.send_error(404)

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8081
    print(f"Starting Flux Server with COOP/COEP on port {port}...")
    print(f"URL: http://localhost:{port}")
    HTTPServer(('', port), CORSRequestHandler).serve_forever()
