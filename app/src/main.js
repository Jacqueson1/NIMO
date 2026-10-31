const API = "http://localhost:8000";

const messagesEl = document.getElementById("messages");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("send");
import { initAvatar, setTalking } from "./avatar.js";

initAvatar(document.getElementById("avatar-canvas")).catch((err) => {
  console.error("Avatar failed to load:", err);
});

function addMessage(role, text = "") {
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  el.textContent = text;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return el;
}

function setBusy(busy) {
  sendBtn.disabled = busy;
  inputEl.disabled = busy;
  if (!busy) inputEl.focus();
}

async function sendMessage(text) {
  addMessage("user", text);
  const botEl = addMessage("bot", "");
  setBusy(true);

  try {
    const res = await fetch(`${API}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    setTalking(true); 

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      botEl.textContent += decoder.decode(value, { stream: true });
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  } catch (err) {
    botEl.textContent = "⚠ Can't reach the backend. Is uvicorn running on port 8000?";
    console.error(err);
  } finally {

    setTalking(false);  
    setBusy(false);
  }
}

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = inputEl.value.trim();
  if (!text) return;
  inputEl.value = "";
  sendMessage(text);
});

inputEl.focus();