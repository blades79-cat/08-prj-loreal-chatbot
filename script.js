/******************************
 ✅ CORRECT CLOUDFLARE WORKER URL (do not edit)
******************************/
const WORKER_URL = "https://silent-brook-0fad.blades79.workers.dev";

/******************************
 DOM ELEMENTS
******************************/
const chat = document.querySelector('#chat-window');
const form = document.querySelector('#chat-form');
const input = document.querySelector('#user-input');
const qPreview = document.querySelector('#question-preview');
const qText = document.querySelector('#q-text');
const tpl = document.querySelector('#msg-template');

const history = []; // conversation memory: [{role, content}]

/******************************
 UI HELPERS
******************************/
function bubble(text, who = 'bot') {
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add(who);
  node.querySelector('.bubble').textContent = text;
  chat.appendChild(node);
  chat.scrollTop = chat.scrollHeight;
  return node;
}

function typingBubble() {
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add('bot');
  node.querySelector('.bubble').innerHTML =
    `<span class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>`;
  chat.appendChild(node);
  chat.scrollTop = chat.scrollHeight;
  return node;
}

function setLatestQuestionPreview(text) {
  const t = (text || "").trim();
  if (!t) { qPreview.hidden = true; qText.textContent = ""; return; }
  qText.textContent = t;
  qPreview.hidden = false;
}

/******************************
 STRICT BEAUTY-ONLY SYSTEM PROMPT
******************************/
const systemPrompt = `
You are L’Oréal Beauty AI.
ONLY answer questions about skincare, makeup, haircare, fragrance, beauty routines, ingredients, and L’Oréal products.
If the user asks anything unrelated, reply exactly:
"Sorry! I can only help with beauty and L’Oréal product questions 💄✨"
Be concise, brand-appropriate, and explain WHY for recommendations (skin type/concern, finish, key actives).
`;

/******************************
 INITIAL MESSAGE
******************************/
bubble(
  "Hi! I’m L’Oréal Beauty AI 👋 Ask me about skincare, makeup, haircare, or fragrance. I can build routines, compare products, and explain ingredients. Off-topic questions will be declined politely ✨",
  "bot"
);

/******************************
 QUICK SUGGESTION PILLS
******************************/
document.querySelectorAll('.pill').forEach(btn => {
  btn.addEventListener('click', () => {
    input.value = btn.dataset.suggest || "";
    input.focus();
  });
});

/******************************
 CALL YOUR WORKER (forwards to OpenAI)
******************************/
async function askModel(userText) {
  // ensure system prompt goes first once
  if (history.length === 0) {
    history.push({ role: "system", content: systemPrompt });
  }
  history.push({ role: "user", content: userText });

  const payload = {
    model: "gpt-4o-mini",
    messages: history,
    temperature: 0.6
  };

  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  // If the worker failed, throw so UI shows friendly error bubble
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Worker ${res.status}: ${text || res.statusText}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content ?? "Sorry—no reply received.";
  history.push({ role: "assistant", content: reply });
  return reply;
}

/******************************
 FORM SUBMIT
******************************/
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  bubble(text, "user");
  setLatestQuestionPreview(text);
  input.value = "";

  const typing = typingBubble();
  try {
    const reply = await askModel(text);
    typing.remove();
    bubble(reply, "bot");
  } catch (err) {
    typing.remove();
    bubble("⚠️ Error: Couldn’t reach the AI service. Please refresh and try again.", "bot");
    console.error(err);
  }
});

/******************************
 ENTER-TO-SEND
******************************/
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});
