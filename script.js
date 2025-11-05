/******************************
 * WORKER URL (YOURS ✅)
 ******************************/
const WORKER_URL = "https://silent-brook-fad.blades79.workers.dev";

/* ====== DOM helpers ====== */
const qs = s => document.querySelector(s);
const chat = qs('#chat-window');
const form = qs('#chat-form');
const input = qs('#user-input');
const qPreview = qs('#question-preview');
const qText = qs('#q-text');
const tpl = document.querySelector('#msg-template');

const history = []; // will store {role, content}

/* ====== UI utils ====== */
function bubble(text, who = 'bot'){
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add(who);
  node.querySelector('.bubble').textContent = text;
  chat.appendChild(node);
  chat.scrollTop = chat.scrollHeight;
  return node;
}
function typingBubble(){
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add('bot');
  const b = node.querySelector('.bubble');
  b.innerHTML = `<span class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>`;
  chat.appendChild(node);
  chat.scrollTop = chat.scrollHeight;
  return node;
}
function setLatestQuestionPreview(text){
  if (!text || !text.trim()){ qPreview.hidden = true; qText.textContent = ''; return; }
  qText.textContent = text.trim();
  qPreview.hidden = false;
}

/* ====== System prompt (beauty-only) ====== */
const systemPrompt = `
You are L'Oréal Beauty AI.
ONLY answer questions about beauty (skincare, makeup, haircare, fragrance), routines, ingredients, and L'Oréal products.
If the user asks about anything unrelated, reply exactly:
"Sorry! I can only help with beauty and L’Oréal product questions 💄✨"
Keep answers helpful, brand-appropriate, and concise, but include why you recommend products (skin type/concern/finish/key actives).
`;

/* ====== Initial greeting ====== */
bubble("Hi! I’m L’Oréal Beauty AI 👋 Ask me about skincare, makeup, haircare, or fragrance. I can build routines, compare products, and explain ingredients. Off-topic questions will be declined politely ✨", 'bot');

/* ====== Suggestion pills ====== */
document.querySelectorAll('.pill').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    input.value = btn.dataset.suggest;
    input.focus();
  });
});

/* ====== Core: call your Worker with full OpenAI payload ====== */
async function askModel(userText){
  // Add messages to history
  if (history.length === 0){
    history.push({ role: 'system', content: systemPrompt });
  }
  history.push({ role: 'user', content: userText });

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

  if (!res.ok){
    const t = await res.text().catch(()=> "");
    throw new Error(`Network/Worker error ${res.status}: ${t || res.statusText}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content ?? "Sorry—no reply received.";
  history.push({ role: 'assistant', content: reply });
  return reply;
}

/* ====== Form handling ====== */
form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  bubble(text, 'user');
  setLatestQuestionPreview(text);
  input.value = '';

  const typing = typingBubble();
  try{
    const reply = await askModel(text);
    typing.remove();
    bubble(reply, 'bot');
  }catch(err){
    typing.remove();
    bubble("⚠️ Error: Couldn’t reach the AI service. Check your Worker URL is correct & deployed.", 'bot');
    console.error(err);
  }
});

/* Enter to send */
input.addEventListener('keydown', (e)=>{
  if (e.key === 'Enter' && !e.shiftKey){
    e.preventDefault();
    form.requestSubmit();
  }
});
