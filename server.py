from http.server import HTTPServer, SimpleHTTPRequestHandler
import sys
import socketserver # [NEW] For threading

import json
import os
import urllib.request

# [NEW] Threaded Server to prevent blocking during AI inference
class ThreadingHTTPServer(socketserver.ThreadingMixIn, HTTPServer):
    daemon_threads = True

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
            
            try:
                data = json.loads(post_data)
                
                # -- ROUTING LOGIC (Hybrid AI) --
                req_type = data.get('type', 'analysis')
                
                system_prompt = ""
                user_msg = ""
                
                if req_type == 'micro_coaching':
                    habit = data.get('habitName', 'Task')
                    energy = data.get('energyLevel', 50)
                    system_prompt = "You are a motivational coach. Output a single short sentence based on energy level (max 10 words) in SPANISH. JSON Output: { \"message\": \"string\" }"
                    user_msg = f"User completed: {habit}. Energy: {energy}%. Praise them in Spanish."
                else:
                    # Default Analysis
                    energy = data.get('energy_level', 50)
                    tags = data.get('semantic_tags', [])
                    note = data.get('journal_note', '')
                    history = data.get('history_context', 'No history.')
                    
                    system_prompt = """
                    You are Flux, an advanced behavioral psychologist AI. 
                    Analyze the user's biological energy and history to decide the optimal "Operating Mode".
                    
                    Modes:
                    - survival (<30% energy): Minimal effort.
                    - maintenance (30-70% energy): Consistency.
                    - expansion (>70% energy): Deep work.

                    Output JSON ONLY:
                    {
                        "context": "survival|maintenance|expansion",
                        "reasoning": "Brief psychological analysis (max 1 sentence) in SPANISH. Cite history if relevant.",
                        "actionable_tip": "One specific micro-habit in SPANISH."
                    }
                    """
                    user_msg = f"Energy: {energy}%, Tags: {', '.join(tags)}, Note: {note}, History: {history}"

            except Exception as e:
                self.send_error(400, f"Bad Request: {str(e)}")
                return

            # 3. Call AI Provider (Ollama / OpenAI)
            provider = os.environ.get("AI_PROVIDER", "ollama").lower()
            response_payload = {}

            try:
                # --- OPTION A: OLLAMA (Local Home Server) ---
                if provider == "ollama":
                    model_name = os.environ.get("OLLAMA_MODEL", "llama3")
                    api_url = os.environ.get("OLLAMA_URL", "http://localhost:11434/api/chat")
                    
                    print(f"🔄 Bridging to Ollama: {api_url} (Model: {model_name})")
                    
                    req = urllib.request.Request(
                        api_url,
                        data=json.dumps({
                            "model": model_name,
                            "messages": [
                                {"role": "system", "content": system_prompt + " IMPORTANT: Return JSON Object only."},
                                {"role": "user", "content": user_msg}
                            ],
                            "stream": False,
                            "format": "json" # Ollama JSON mode
                        }).encode('utf-8'),
                        headers={"Content-Type": "application/json"},
                        method="POST"
                    )
                    
                    # Set timeout (short for coaching, long for analysis)
                    # Bumped to 30s to allow for older hardware/CPU inference
                    timeout = 30 if req_type == 'micro_coaching' else 60
                    
                    print(f"⏳ Sending to Ollama (Timeout: {timeout}s)...")
                    with urllib.request.urlopen(req, timeout=timeout) as f:
                        response_body = f.read().decode('utf-8')
                        ollama_data = json.loads(response_body)
                        # Ollama returns content in 'message.content'
                        ai_json = json.loads(ollama_data['message']['content'])
                        
                        if req_type == 'micro_coaching':
                             response_payload = ai_json # Direct message object
                        else:
                            response_payload = {
                                "status": "success",
                                "model_used": f"ollama-{model_name}",
                                "analysis": ai_json
                            }
                        print("✅ Ollama Response Received!")


                # --- OPTION B: OPENAI (Backup) ---
                else: 
                    api_key = os.environ.get("OPENAI_API_KEY")
                    if not api_key:
                        self.send_error(500, "Missing OPENAI_API_KEY. Set AI_PROVIDER=ollama to use local GPU.")
                        return

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
                        
                        if req_type == 'micro_coaching':
                             response_payload = ai_content
                        else:
                            response_payload = {
                                "status": "success",
                                "model_used": openai_data['model'],
                                "analysis": ai_content
                            }

                # Send Final Response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_payload).encode('utf-8'))

            except urllib.error.HTTPError as e:
                err_body = e.read().decode('utf-8')
                print(f"❌ AI Provider HTTP Error ({provider}): {e.code} - {err_body}")
                self.send_error(502, f"AI Error: {e.code} - {err_body}")
            except Exception as e:
                print(f"❌ AI Provider Error ({provider}): {e}")
                self.send_error(502, f"AI Error: {str(e)}")

        else:
            self.send_error(404)

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8081
    print(f"Starting Flux Server (Threaded) with COOP/COEP on port {port}...")
    print(f"URL: http://localhost:{port}")
    # Use Threaded Server
    ThreadingHTTPServer(('', port), CORSRequestHandler).serve_forever()
