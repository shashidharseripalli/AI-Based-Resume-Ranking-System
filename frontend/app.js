const candidateListEl = document.getElementById("candidateList");
const candidateTemplate = document.getElementById("candidateTemplate");
const addCandidateBtn = document.getElementById("addCandidateBtn");
const rankBtn = document.getElementById("rankBtn");
const statusMessageEl = document.getElementById("statusMessage");
const resultsContainerEl = document.getElementById("resultsContainer");

const apiBaseEl = document.getElementById("apiBase");
const tfidfWeightEl = document.getElementById("tfidfWeight");
const keywordWeightEl = document.getElementById("keywordWeight");
const jobDescriptionEl = document.getElementById("jobDescription");

function setStatus(message, isError = false) {
  statusMessageEl.textContent = message;
  statusMessageEl.style.color = isError ? "#b42318" : "#5f6c7a";
}

function createCandidateCard(candidateId = "", resumeText = "") {
  const fragment = candidateTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".candidate-card");
  const idInput = fragment.querySelector(".candidate-id");
  const resumeInput = fragment.querySelector(".resume-text");
  const removeBtn = fragment.querySelector(".remove-btn");

  idInput.value = candidateId;
  resumeInput.value = resumeText;

  removeBtn.addEventListener("click", () => {
    card.remove();
    if (!candidateListEl.children.length) {
      addCandidateCard();
    }
  });

  candidateListEl.appendChild(fragment);
}

function addCandidateCard() {
  createCandidateCard();
}

function readCandidates() {
  const cards = [...candidateListEl.querySelectorAll(".candidate-card")];
  return cards
    .map((card) => ({
      candidate_id: card.querySelector(".candidate-id").value.trim(),
      resume_text: card.querySelector(".resume-text").value.trim(),
    }))
    .filter((row) => row.candidate_id || row.resume_text);
}

function ensureValidWeights(tfidf, keyword) {
  const isRangeValid =
    Number.isFinite(tfidf) &&
    Number.isFinite(keyword) &&
    tfidf >= 0 &&
    tfidf <= 1 &&
    keyword >= 0 &&
    keyword <= 1;
  if (!isRangeValid) {
    return "Both weights must be numbers between 0 and 1.";
  }
  const total = tfidf + keyword;
  if (Math.abs(total - 1) > 0.001) {
    return "Weights must add up to 1.0.";
  }
  return "";
}

function renderResults(results) {
  if (!Array.isArray(results) || !results.length) {
    resultsContainerEl.className = "results empty";
    resultsContainerEl.textContent = "No ranking results returned by backend.";
    return;
  }

  const rows = results
    .map((item) => {
      const matched = Array.isArray(item.matched_keywords) ? item.matched_keywords : [];
      const keywordPills = matched.length
        ? matched.map((word) => `<span class="pill">${escapeHtml(word)}</span>`).join("")
        : "<span class=\"mono\">-</span>";

      return `
        <tr>
          <td class="mono">${escapeHtml(item.candidate_id ?? "-")}</td>
          <td class="mono">${formatNumber(item.score, 2)}</td>
          <td class="mono">${formatNumber(item.tfidf_score, 4)}</td>
          <td class="mono">${formatNumber(item.keyword_coverage, 4)}</td>
          <td><div class="pill-wrap">${keywordPills}</div></td>
        </tr>
      `;
    })
    .join("");

  resultsContainerEl.className = "results";
  resultsContainerEl.innerHTML = `
    <table class="results-table">
      <thead>
        <tr>
          <th>Candidate</th>
          <th>Score (0-100)</th>
          <th>TF-IDF</th>
          <th>Keyword Coverage</th>
          <th>Matched Keywords</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function formatNumber(value, digits) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(digits) : "-";
}

function escapeHtml(raw) {
  return String(raw)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

async function rankCandidates() {
  const jobDescription = jobDescriptionEl.value.trim();
  const resumes = readCandidates();
  const tfidfWeight = Number(tfidfWeightEl.value);
  const keywordWeight = Number(keywordWeightEl.value);
  const apiBase = apiBaseEl.value.trim().replace(/\/+$/, "");

  if (!apiBase) {
    setStatus("Please provide an API base URL.", true);
    return;
  }
  if (!jobDescription) {
    setStatus("Job description is required.", true);
    return;
  }
  if (!resumes.length) {
    setStatus("Add at least one candidate resume.", true);
    return;
  }

  const malformed = resumes.find((r) => !r.candidate_id || !r.resume_text);
  if (malformed) {
    setStatus("Each candidate must have both ID and resume text.", true);
    return;
  }

  const weightError = ensureValidWeights(tfidfWeight, keywordWeight);
  if (weightError) {
    setStatus(weightError, true);
    return;
  }

  const payload = {
    job_description: jobDescription,
    resumes,
    tfidf_weight: tfidfWeight,
    keyword_weight: keywordWeight,
  };

  rankBtn.disabled = true;
  setStatus("Ranking in progress...");

  try {
    const response = await fetch(`${apiBase}/api/rank`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Backend returned ${response.status}: ${text || "Unknown error"}`);
    }

    const data = await response.json();
    const results = Array.isArray(data) ? data : data.results;
    renderResults(results);
    setStatus(`Received ${Array.isArray(results) ? results.length : 0} ranked candidates.`);
  } catch (error) {
    setStatus(error.message || "Failed to fetch rankings from backend.", true);
  } finally {
    rankBtn.disabled = false;
  }
}

addCandidateBtn.addEventListener("click", addCandidateCard);
rankBtn.addEventListener("click", rankCandidates);

createCandidateCard(
  "cand_001",
  "Python SQL machine learning NLP scikit-learn Flask REST APIs."
);
createCandidateCard(
  "cand_002",
  "Java Spring Boot microservices Kubernetes Docker."
);
