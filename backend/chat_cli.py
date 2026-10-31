import json
import httpx

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "qwen2.5:7b"

SYSTEM_PROMPT = "You are Mao, a friendly and cheerful assistant. Keep replies short and natural."

history = [{"role": "system", "content": SYSTEM_PROMPT}]

while True:
    user = input("You: ").strip()
    if user.lower() in {"exit", "quit"}:
        break
    history.append({"role": "user", "content": user})

    reply = ""
    print("Mao: ", end="", flush=True)
    with httpx.stream(
        "POST",
        OLLAMA_URL,
        json={"model": MODEL, "messages": history, "stream": True},
        timeout=None,
    ) as r:
        for line in r.iter_lines():
            if not line:
                continue
            chunk = json.loads(line)
            token = chunk.get("message", {}).get("content", "")
            reply += token
            print(token, end="", flush=True)
    print()
    history.append({"role": "assistant", "content": reply})