(() => {
  const form = document.getElementById("carForm");
  const out = document.getElementById("carResult");
  const steps = ["Manufacturer","Model","Category","Leather interior","Fuel type","Gear box type","Drive wheels","Numerical"];
  const optionData = {
    "Category": ["Sedan","SUV","Hatchback","Coupe","Convertible"],
    "Leather interior": ["Yes","No"],
    "Fuel type": ["Petrol","Diesel","Hybrid","Electric"],
    "Gear box type": ["Automatic","Manual"],
    "Drive wheels": ["Front","Rear","All"]
  };
  let idx = 0;

  Object.keys(optionData).forEach((key) => {
    const container = document.getElementById(`buttons-${key}`);
    if (!container) return;
    optionData[key].forEach((value) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = value;
      btn.className = "option-btn";
      btn.onclick = () => {
        document.getElementById(`input${key.replace(/ /g, '')}`).value = value;
        nextPrev(1);
      };
      container.appendChild(btn);
    });
  });

  function showStep(n) {
    steps.forEach((name, i) => {
      const el = document.getElementById(`step-${name}`);
      if (el) el.style.display = i === n ? "block" : "none";
    });
    document.getElementById("prevBtn").disabled = n === 0;
    document.getElementById("nextBtn").style.display = n === steps.length - 1 ? "none" : "inline-block";
    document.getElementById("submitBtn").style.display = n === steps.length - 1 ? "inline-block" : "none";
    document.getElementById("carStepTitle").textContent = `Car Price Prediction - Step ${n + 1}/${steps.length}: ${steps[n]}`;
  }

  function validateStep(name) {
    if (name === "Manufacturer") {
      const v = document.getElementById("selectManufacturer").value;
      if (!v) { alert("Please select a Manufacturer."); return false; }
      document.getElementById("inputManufacturer").value = v;
    } else if (name === "Model") {
      const v = document.getElementById("selectModel").value;
      if (!v) { alert("Please select a Model."); return false; }
      document.getElementById("inputModel").value = v;
    } else if (optionData[name]) {
      const hidden = document.getElementById(`input${name.replace(/ /g, '')}`);
      if (!hidden.value) { alert(`Please select a choice for ${name}.`); return false; }
    } else if (name === "Numerical") {
      const inputs = form.querySelectorAll("#step-Numerical input");
      for (const input of inputs) if (!input.value.trim()) { alert("Please fill all numerical fields."); return false; }
    }
    return true;
  }

  function nextPrev(delta) {
    const curr = steps[idx];
    if (delta === 1 && !validateStep(curr)) return;
    idx = Math.max(0, Math.min(steps.length - 1, idx + delta));
    showStep(idx);
  }

  document.getElementById("prevBtn").addEventListener("click", () => nextPrev(-1));
  document.getElementById("nextBtn").addEventListener("click", () => nextPrev(1));
  showStep(idx);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    out.textContent = "Predicting...";
    const fd = new FormData(form);
    try {
      const res = await fetch("/predict_car", { method: "POST", body: fd });
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const div = doc.querySelector("#carPredictionResult");
      out.innerHTML = div ? div.innerHTML : html;
    } catch (err) {
      out.textContent = "Error: " + err.message;
    }
  });
})();