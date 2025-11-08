// frontend/app.js
const form = document.getElementById("promptForm");
const promptInput = document.getElementById("promptInput");
const generateBtn = document.getElementById("generateBtn");
const placeholder = document.getElementById("placeholder");
const result = document.getElementById("result");

function setLoading(on) {
  if (on) {
    generateBtn.disabled = true;
    generateBtn.textContent = "Generating Text...";
    generateBtn.classList.add("loading");
    result.classList.add("hidden");
  } else {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate";
    generateBtn.classList.remove("loading");
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const prompt = promptInput.value.trim();
  if (!prompt) return alert("Please enter a prompt.");

  setLoading(true);
  placeholder.classList.add("hidden");

  try {
    // <-- IMPORTANT: call backend on port 3000 explicitly
    const resp = await fetch("http://localhost:3001/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error(data);
      alert("Generation failed. Check console for details.");
      placeholder.classList.remove("hidden");
      imageWrap.classList.add("hidden");
      return;
    }

    if (data.text) {
      let processed = data.text.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
      processed = processed.replace(/### (.*)/g, '<br>$1');
      placeholder.innerHTML = processed;
      placeholder.classList.remove("hidden");
      result.classList.remove("hidden");
    } else if (data.raw) {
      placeholder.textContent = "API returned an unexpected response. Check console.";
      placeholder.classList.remove("hidden");
      result.classList.remove("hidden");
      console.log("raw response", data.raw);
    } else {
      placeholder.textContent = "Unknown response from backend. See console.";
      placeholder.classList.remove("hidden");
      result.classList.remove("hidden");
      console.log("Unknown response:", data);
    }
  } catch (err) {
    console.error("Request error:", err);
    alert("Network error. See console.");
    placeholder.classList.remove("hidden");
    result.classList.remove("hidden");
  } finally {
    setLoading(false);
  }
});

