const uploadResumesBtn = document.getElementById("uploadResumesBtn");
const resumeUploadInput = document.getElementById("resumeUploadInput");
const uploadSummaryEl = document.getElementById("uploadSummary");
const rankBtn = document.getElementById("rankBtn");
const statusMessageEl = document.getElementById("statusMessage");
const resultsContainerEl = document.getElementById("resultsContainer");
const jobDescriptionEl = document.getElementById("jobDescription");

const API_BASE_URL = "http://localhost:8000";
const TFIDF_WEIGHT = 0.8;
const KEYWORD_WEIGHT = 0.2;
const PDF_WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const uploadedResumes = [];

const SUPPORTED_TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".text",
  ".csv",
  ".json",
  ".log",
  ".rtf",
]);

const SUPPORTED_RESUME_EXTENSIONS = new Set([
  ...SUPPORTED_TEXT_EXTENSIONS,
  ".pdf",
  ".doc",
  ".docx",
]);

if (window.pdfjsLib?.GlobalWorkerOptions) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
}

function setStatus(message, isError = false) {
  statusMessageEl.textContent = message;
  statusMessageEl.style.color = isError ? "#b42318" : "#5f6c7a";
}

function updateUploadSummary() {
  uploadSummaryEl.textContent = `Uploaded resumes: ${uploadedResumes.length}`;
}

function fileBaseName(filename) {
  const safeName = String(filename || "").trim();
  const idx = safeName.lastIndexOf(".");
  return idx > 0 ? safeName.slice(0, idx) : safeName;
}

function toTitleCase(value) {
  return String(value || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeCandidateId(raw) {
  const normalized = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || "candidate";
}

function extractCandidateName(resumeText, filename) {
  const blocked = new Set([
    "resume",
    "curriculum vitae",
    "cv",
    "professional summary",
    "objective",
    "profile",
    "contact",
    "education",
    "experience",
    "skills",
  ]);
  const lines = String(resumeText || "")
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .slice(0, 20);

  for (const line of lines) {
    if (line.length < 3 || line.length > 60) {
      continue;
    }
    const lower = line.toLowerCase();
    if (blocked.has(lower)) {
      continue;
    }
    if (/[0-9@]/.test(line)) {
      continue;
    }
    const tokens = line.split(" ").filter(Boolean);
    if (tokens.length < 2 || tokens.length > 4) {
      continue;
    }
    const mostlyLetters = tokens.every((token) => /^[A-Za-z][A-Za-z'-.]*$/.test(token));
    if (!mostlyLetters) {
      continue;
    }
    return toTitleCase(line);
  }

  const fallback = fileBaseName(filename).replace(/[_-]+/g, " ");
  return toTitleCase(fallback) || "Unknown Candidate";
}

function nextAvailableCandidateId(baseId, takenIds) {
  if (!takenIds.has(baseId)) {
    takenIds.add(baseId);
    return baseId;
  }
  let suffix = 2;
  while (takenIds.has(`${baseId}_${suffix}`)) {
    suffix += 1;
  }
  const nextId = `${baseId}_${suffix}`;
  takenIds.add(nextId);
  return nextId;
}

function isLikelyTextFile(file) {
  const name = String(file?.name || "").toLowerCase();
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  return file?.type?.startsWith("text/") || SUPPORTED_TEXT_EXTENSIONS.has(ext);
}

function getFileExtension(file) {
  const name = String(file?.name || "").toLowerCase();
  return name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
}

function normalizeExtractedText(text) {
  return String(text || "")
    .replace(/\u0000/g, " ")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function printableCharacterRatio(text) {
  const value = String(text || "");
  if (!value) {
    return 0;
  }
  let printable = 0;
  for (const char of value) {
    if (/[\r\n\t -~]/.test(char)) {
      printable += 1;
    }
  }
  return printable / value.length;
}

async function extractTextFromPdf(file) {
  if (!window.pdfjsLib) {
    throw new Error("PDF parser failed to load. Refresh and try again.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = window.pdfjsLib.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const line = content.items.map((item) => item.str || "").join(" ");
    if (line.trim()) {
      pages.push(line);
    }
  }
  return normalizeExtractedText(pages.join("\n"));
}

async function extractTextFromDocx(file) {
  if (!window.mammoth?.extractRawText) {
    throw new Error("DOCX parser failed to load. Refresh and try again.");
  }
  const buffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer: buffer });
  return normalizeExtractedText(result.value);
}

async function extractTextFromDoc(file) {
  const bytes = await file.arrayBuffer();
  const text = new TextDecoder("latin1").decode(bytes);
  const cleaned = normalizeExtractedText(text);
  const ratio = printableCharacterRatio(cleaned);
  if (!cleaned || ratio < 0.75) {
    throw new Error("Legacy .doc extraction is limited. Please convert this file to .docx or .pdf.");
  }
  return cleaned;
}

async function extractResumeText(file) {
  const ext = getFileExtension(file);
  if (isLikelyTextFile(file)) {
    return normalizeExtractedText(await file.text());
  }
  if (ext === ".pdf") {
    return extractTextFromPdf(file);
  }
  if (ext === ".docx") {
    return extractTextFromDocx(file);
  }
  if (ext === ".doc") {
    return extractTextFromDoc(file);
  }
  throw new Error("Unsupported file type.");
}

async function importResumeFiles(fileList) {
  const files = [...fileList];
  if (!files.length) {
    return;
  }

  const takenIds = new Set(uploadedResumes.map((row) => row.candidate_id));
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const errors = [];

  for (const file of files) {
    const ext = getFileExtension(file);
    if (!SUPPORTED_RESUME_EXTENSIONS.has(ext) && !isLikelyTextFile(file)) {
      skipped += 1;
      continue;
    }

    try {
      const resumeText = await extractResumeText(file);
      if (!resumeText) {
        skipped += 1;
        continue;
      }

      const baseId = normalizeCandidateId(fileBaseName(file.name));
      const candidateId = nextAvailableCandidateId(baseId, takenIds);
      const candidateName = extractCandidateName(resumeText, file.name);
      const resumeUrl = URL.createObjectURL(file);
      uploadedResumes.push({
        candidate_id: candidateId,
        candidate_name: candidateName,
        resume_text: resumeText,
        resume_url: resumeUrl,
      });
      imported += 1;
    } catch (error) {
      failed += 1;
      errors.push(`${file.name}: ${error.message || "Could not read file"}`);
    }
  }

  updateUploadSummary();

  if (!imported && !skipped && failed) {
    setStatus(`Could not import files. ${errors[0] || "Unknown file read error."}`, true);
    return;
  }

  let status = `Imported ${imported} resume${imported === 1 ? "" : "s"}.`;
  if (skipped) {
    status += ` Skipped ${skipped} unsupported or empty file${skipped === 1 ? "" : "s"}.`;
  }
  if (failed) {
    status += ` Failed ${failed} file read${failed === 1 ? "" : "s"}.`;
  }
  setStatus(status, false);
}

function readCandidates() {
  return uploadedResumes.map((row) => ({
    candidate_id: row.candidate_id,
    resume_text: row.resume_text,
  }));
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

  const resumeById = new Map(uploadedResumes.map((row) => [row.candidate_id, row]));
  const rows = results
    .map((item, index) => {
      const matched = Array.isArray(item.matched_keywords) ? item.matched_keywords : [];
      const keywordPills = matched.length
        ? matched.map((word) => `<span class="pill">${escapeHtml(word)}</span>`).join("")
        : "<span class=\"mono\">-</span>";
      const uploaded = resumeById.get(String(item.candidate_id ?? "")) || {};
      const candidateName = uploaded.candidate_name || fileBaseName(item.candidate_id) || "-";
      const resumeLink = uploaded.resume_url
        ? `<a href="${escapeHtml(uploaded.resume_url)}" target="_blank" rel="noopener noreferrer">Open Resume</a>`
        : "<span class=\"mono\">-</span>";

      return `
        <tr>
          <td class="mono">${index + 1}</td>
          <td>${escapeHtml(candidateName)}</td>
          <td class="mono">${escapeHtml(item.candidate_id ?? "-")}</td>
          <td class="mono">${formatNumber(item.score, 2)}</td>
          <td class="mono">${formatNumber(item.tfidf_score, 4)}</td>
          <td class="mono">${formatNumber(item.keyword_coverage, 4)}</td>
          <td>${resumeLink}</td>
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
          <th>Rank</th>
          <th>Name</th>
          <th>Candidate</th>
          <th>Score (0-100)</th>
          <th>TF-IDF</th>
          <th>Keyword Coverage</th>
          <th>Resume</th>
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
  const tfidfWeight = TFIDF_WEIGHT;
  const keywordWeight = KEYWORD_WEIGHT;
  const apiBase = API_BASE_URL.replace(/\/+$/, "");

  if (!jobDescription) {
    setStatus("Job description is required.", true);
    return;
  }
  if (!resumes.length) {
    setStatus("Upload at least one resume.", true);
    return;
  }

  const malformed = resumes.find((r) => !r.candidate_id || !r.resume_text);
  if (malformed) {
    setStatus("Each uploaded resume must include readable text.", true);
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

uploadResumesBtn.addEventListener("click", () => {
  resumeUploadInput.click();
});

resumeUploadInput.addEventListener("change", async (event) => {
  await importResumeFiles(event.target.files);
  resumeUploadInput.value = "";
});

rankBtn.addEventListener("click", rankCandidates);
updateUploadSummary();
