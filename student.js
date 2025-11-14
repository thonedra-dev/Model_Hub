(() => {
  const form = document.getElementById("studentForm");
  const out = document.getElementById("studentResult");

  const steps = [
    "Parental_Involvement","Access_to_Resources","Extracurricular_Activities","Motivation_Level",
    "Internet_Access","Family_Income","Teacher_Quality","School_Type","Peer_Influence",
    "Learning_Disabilities","Parental_Education_Level","Distance_from_Home_cat","Gender","Numerical"
  ];
  const options = {
    Parental_Involvement: ["Low","Medium","High"],
    Access_to_Resources: ["Low","Medium","High"],
    Extracurricular_Activities: ["No","Yes"],
    Motivation_Level: ["Low","Medium","High"],
    Internet_Access: ["Yes","No"],
    Family_Income: ["Low","Medium","High"],
    Teacher_Quality: ["Low","Medium","High","Unknown"],       // why: map Unknown -> ""
    School_Type: ["Public","Private"],
    Peer_Influence: ["Negative","Neutral","Positive"],
    Learning_Disabilities: ["No","Yes"],
    Parental_Education_Level: ["High School","College","Postgraduate","Unknown"],
    Distance_from_Home_cat: ["Near","Moderate","Far","Unknown"],
    Gender: ["Male","Female"]
  };
  let idx = 0;

  // Render option buttons
  Object.entries(options).forEach(([key, arr]) => {
    const group = document.querySelector(`.btn-group[data-target="${key}"]`);
    const hidden = document.getElementById(`spi-${key.replace(/ /g,'_')}`);
    if (!group || !hidden) return;
    arr.forEach((val) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "option-btn";
      b.textContent = val;
      b.addEventListener("click", () => {
        group.querySelectorAll("button").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        hidden.value = val;
      });
      group.appendChild(b);
    });
  });

  function show(n) {
    steps.forEach((name, i) => {
      const el = document.getElementById(`sstep-${name}`);
      if (el) el.style.display = i === n ? "block" : "none";
    });
    document.getElementById("studentPrevBtn").disabled = n === 0;
    document.getElementById("studentNextBtn").style.display = n === steps.length - 1 ? "none" : "inline-block";
    document.getElementById("studentSubmitBtn").style.display = n === steps.length - 1 ? "inline-block" : "none";
    document.getElementById("studentStepTitle").textContent = `Student Performance - Step ${n + 1}/${steps.length}: ${steps[n]}`;
  }

  function validateCurrent() {
    const name = steps[idx];
    if (name === "Numerical") {
      const inputs = form.querySelectorAll("#sstep-Numerical input");
      for (const input of inputs) if (!input.value.trim()) { alert("Please fill all numerical fields."); return false; }
    } else {
      const hidId = name === "Distance_from_Home_cat" ? "spi-Distance_from_Home_cat" : `spi-${name}`;
      const hidden = document.getElementById(hidId);
      if (!hidden.value) { alert(`Please select: ${name.replace(/_/g,' ')}`); return false; }
    }
    return true;
  }

  document.getElementById("studentPrevBtn").addEventListener("click", () => { idx = Math.max(0, idx - 1); show(idx); });
  document.getElementById("studentNextBtn").addEventListener("click", () => { if (!validateCurrent()) return; idx = Math.min(steps.length - 1, idx + 1); show(idx); });
  show(idx);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateCurrent()) return;

    const UNKNOWN_FIELDS = new Set(["Teacher_Quality","Parental_Education_Level","Distance_from_Home_cat"]);
    const fd = new FormData(form);

    // Map Unknown -> "" for selected fields (backend treats "" as None)
    for (const key of Array.from(fd.keys())) {
      const v = fd.get(key);
      if (UNKNOWN_FIELDS.has(key) && String(v) === "Unknown") fd.set(key, "");
    }
    // Normalize Distance_from_Home field name
    if (fd.has("Distance_from_Home_cat")) {
      fd.set("Distance_from_Home", fd.get("Distance_from_Home_cat"));
      fd.delete("Distance_from_Home_cat");
    }

    out.textContent = "Predicting...";
    try {
      const res = await fetch("/predict_student", { method: "POST", body: fd });
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const div = doc.querySelector("#studentPredictionResult");
      out.innerHTML = div ? div.innerHTML : html;
    } catch (err) {
      out.textContent = "Error: " + err.message;
    }
  });
})();