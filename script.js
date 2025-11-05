// ✅ DOM elements
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// ✅ Cloudflare Worker URL (yours)
const WORKER_URL = "https://silent-brook-0fad.blades79.workers.dev";

// ✅ Initial welcome message
chatWindow.innerHTML = `<div class="bot-message">👋 Hello! How can I help you today?</div>`;

// ✅ System prompt for L'Oréal beauty bot
const systemPrompt = `
You are the official L’Oréal Beauty Assistant.
Only answer questions about skincare, makeup, haircare, fragrances,
beauty routines, L’Oréal brands, and product recommendations.
If asked anything else, politely say:
"I'm here to help with beauty — ask me about products, routines, or recommendations!"
`;

// ✅ Handle message send
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  // Show user's message
  chatWindow.innerHTML += `<div class="user-message">${text}</div>`;
  userInput.value = "";

  // Show typing placeholder
  chatWindow.innerHTML += `<div class="bot-message" id="typing">💬 Thinking...</div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    // ✅ Send request to Cloudflare Worker
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: systemPrompt,
        user: text
      })
    });

    const data = await res.json();

    // Remove typing placeholder
    document.getElementById("typing").remove();

    // Show AI response
    chatWindow.innerHTML += `<div class="bot-message">${data.response}</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;

  } catch (err) {
    document.getElementById("typing").remove();
    chatWindow.innerHTML += `<div class="bot-message">⚠️ Error: Could not reach AI service.</div>`;
  }
});
