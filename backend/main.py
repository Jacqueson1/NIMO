import json
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "qwen2.5:7b"
SYSTEM_PROMPT = (
    "You are Mao, a friendly and cheerful assistant. Keep replies short and natural.\n"
    "Start EVERY reply with exactly one mood tag in square brackets, chosen from: "
    "[neutral] [happy] [excited] [sad] [embarrassed] [shocked] [angry]. "
    "Pick the one that matches how you feel about your reply. "
    "Example: [happy] Nice to meet you! "
    "Never mention or explain the tag."
)


app = FastAPI()

# Tauri's WebView calls us from a different origin, so allow it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

history = [{"role": "system", "content": SYSTEM_PROMPT}]


class ChatRequest(BaseModel):
    message: str


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL}


@app.post("/chat")
async def chat(req: ChatRequest):
    history.append({"role": "user", "content": req.message})

    async def generate():
        reply = ""
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream(
                "POST",
                OLLAMA_URL,
                json={"model": MODEL, "messages": history, "stream": True},
            ) as r:
                async for line in r.aiter_lines():
                    if not line:
                        continue
                    token = json.loads(line).get("message", {}).get("content", "")
                    if token:
                        reply += token
                        yield token
        history.append({"role": "assistant", "content": reply})

    return StreamingResponse(generate(), media_type="text/plain")


@app.post("/reset")
def reset():
    del history[1:]
    return {"status": "cleared"}