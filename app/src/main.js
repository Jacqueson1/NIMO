import { initAvatar, setTalking, setMood, playGesture } from "./avatar.js";

initAvatar(document.getElementById("avatar-canvas")).catch((err) => {
  console.error("Avatar failed to load:", err);
});

const API = "http://localhost:8000";

const messagesEl = document.getElementById("messages");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("send");

let moodTimer = null;

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

// Reads a leading "[mood]" tag from the streamed text.
// Returns null while we can't tell yet, otherwise { mood, text }.
function parseMood(raw) {
  const trimmed = raw.trimStart();
  if (trimmed === "") return null;
  if (!trimmed.startsWith("[")) return { mood: "neutral", text: raw };

  const end = trimmed.indexOf("]");
  if (end === -1) {
    // tag still arriving; give up if it's clearly not a tag
    return trimmed.length > 20 ? { mood: "neutral", text: raw } : null;
  }
  const mood = trimmed.slice(1, end).trim().toLowerCase();
  return { mood, text: trimmed.slice(end + 1).trimStart() };
}

async function sendMessage(text) {
  clearTimeout(moodTimer);
  addMessage("user", text);
  const botEl = addMessage("bot", "");
  setBusy(true);

  let raw = "";
  let moodApplied = false;

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
      raw += decoder.decode(value, { stream: true });

      const parsed = parseMood(raw);
      if (!parsed) continue;

      if (!moodApplied) {
        moodApplied = true;
        setMood(parsed.mood);
        playGesture();
      }
      botEl.textContent = parsed.text;
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  } catch (err) {
    botEl.textContent = "⚠ Can't reach the backend. Is uvicorn running on port 8000?";
    console.error(err);
  } finally {
    setTalking(false);
    setBusy(false);
    // return to a neutral face a few seconds after she finishes
    moodTimer = setTimeout(() => setMood("neutral"), 4000);
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