(() => {
  const form = document.getElementById("houseForm");
  const out = document.getElementById("houseResult");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);

    // --- DEBUG: show what data JS received ---
    let debugMsg = "JS received form data:\n";
    for (let [key, value] of fd.entries()) {
      debugMsg += `${key}: ${value}\n`;
    }
    out.textContent = debugMsg;  // <-- this will be visible on UI

    try {
      const res = await fetch("/predict", { method: "POST", body: fd });
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const div = doc.querySelector("#housePredictionResult");
      out.innerHTML = div ? div.innerHTML : html;
    } catch (err) {
      out.textContent = "Error: " + err.message;
    }
  });
})();
