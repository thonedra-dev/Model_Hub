(() => {
  const form = document.getElementById("wineForm");
  const out = document.getElementById("wineResult");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    out.textContent = "Predicting...";
    try {
      const res = await fetch("/predict_wine", { method: "POST", body: fd });
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const div = doc.querySelector("#winePredictionResult");
      out.innerHTML = div ? div.innerHTML : html;
    } catch (err) {
      out.textContent = "Error: " + err.message;
    }
  });
})();