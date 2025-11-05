/******************************
 ✅ CORRECT CLOUDLFRARE WORKER URL (DO NOT CHANGE)
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

const history = []; // chat memory

/******************************
 UI HELPERS
******************************/
function bubble(text, who = 'bot') {
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add(who);
  node.querySelector('.bubble').textContent = text;
  chat.appendChild(node);
  chat.scrollTop = chat.scrollHeight;
}

function typingBubble() {
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add('bot');
  const b = node.querySelector('.bubble');
  b.innerHTML = `<span class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>`;
  chat.appendChild(node);
  chat.scrollTop = chat.scrollHeight;
  return node;
}

function setLatestQuestionPreview(text) {
  if (!text || !text.trim()) { 
    qPreview.hidden = true; 
    qText.textContent = ""; 
    return; 
  }
  qText.textContent = text.trim();
  qPreview.hidden = false;
}

/******************************
 BEAUTY-ONLY SYSTEM PROMPT
******************************/
const systemPrompt = `
You are L’Oréal Beauty AI.
ONLY answer questions about skincare, makeup, haircare, fragrance, beauty routines, ingredients, and L’Oréal products.
If user asks anything unrelated, reply:
"Sorry! I can only help with beauty and L’Oréal product questions 💄✨"
Be helpful, brand-friendly, and explain WHY you recommend products (skin type/concern, key ingredients).
`;

/******************************
 INITIAL WELCOME MESSAGE
******************************/
bubble("Hi! I’m L’Oréal Beauty AI 👋 Ask me about skincare, makeup, haircare, or fragrance. I can build routines, compare products, and explain ingredients. Off-topic questions will be politely declined ✨", "bot");

/******************************
 SUGGESTION BUTTONS
******************************/
document.querySelectorAll('.pill').forEach(btn => {
  btn.addEventListener('click', () => {
    input.value = btn.dataset.suggest;
    input.focus();
  });
});

/******************************
 CALL CLOUDFLARE WORKER
******************************/
async function askModel(text) {
  if (history.length === 0) {
    history.push({ role: "system", content: systemPrompt });
  }
  history.push({ role: "user", content: text });

  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: history,
      temperature: 0.6
    })
  });

  const data = await res.json();

  const reply = data?.choices?.[0]?.message?.content ?? "⚠️ AI returned no response";
  history.push({ role: "assistant", content: reply });

  return reply;
}

/******************************
 HANDLE FORM SUBMIT
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
    bubble("⚠️ Error connecting to AI. Please try again.", "bot");
    console.error(err);
  }
});

/******************************
 ENTER TO SEND
******************************/
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});
