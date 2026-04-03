# AI-Based Resume Ranking System

A production-style starter project for ranking candidate resumes against a job description using NLP-based relevance scoring.

The system combines:
- TF-IDF + cosine similarity for semantic alignment
- Keyword coverage for explicit skill matching
- Weighted score blending for customizable ranking behavior

## Features

- Resume ranking through a Python core engine (`core/`)
- REST API with FastAPI (`backend/`)
- Lightweight frontend for manual testing (`frontend/`)
- Unit tests for preprocessing, scoring, and ranking (`tests/`)
- Demo script for quick local verification (`scripts/run_core_demo.py`)

## How It Works

1. Text is cleaned, tokenized, and normalized.
2. TF-IDF vectors are created for the job description and resumes.
3. Cosine similarity is computed between job description and each resume.
4. Keyword coverage is calculated from overlapping terms.
5. A weighted final score is generated and candidates are ranked descending.

Default weights:
- `tfidf_weight = 0.8`
- `keyword_weight = 0.2`

If custom weights are provided, they are automatically normalized to sum to `1.0`.

## Project Structure

```text
.
|-- backend/                  # FastAPI application
|-- core/                     # Ranking engine (preprocessing, scoring, ranking)
|-- frontend/                 # Static HTML/CSS/JS client
|-- configs/                  # Configuration files (sample scoring config)
|-- data/                     # Sample input data
|-- scripts/run_core_demo.py  # Quick demo runner
|-- tests/                    # Unit tests
|-- requirements.txt
`-- README.md
```

## Installation

### Windows (PowerShell)

```powershell
python -m venv venv
.\venv\Scripts\python -m pip install -r requirements.txt
```

### macOS/Linux

```bash
python3 -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
```

## Run the Backend API

```powershell
.\venv\Scripts\python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

API base URL: `http://localhost:8000`

Useful endpoints:
- `GET /health`
- `POST /api/rank`

## Run the Frontend

Open `frontend/index.html` in your browser and ensure the backend is running.

The frontend is preconfigured for `http://localhost:8000` and calls `POST /api/rank`.

## Run the Demo Script

```powershell
.\venv\Scripts\python scripts\run_core_demo.py
```

## Run Tests

```powershell
.\venv\Scripts\python -m pytest -q
```

## API Contract

### `POST /api/rank`

Request body:

```json
{
  "job_description": "Python developer with SQL and machine learning experience",
  "resumes": [
    { "candidate_id": "cand_001", "resume_text": "Python SQL scikit-learn FastAPI" },
    { "candidate_id": "cand_002", "resume_text": "Java Spring Boot microservices" }
  ],
  "tfidf_weight": 0.8,
  "keyword_weight": 0.2
}
```

Response body:

```json
[
  {
    "candidate_id": "cand_001",
    "score": 87.42,
    "tfidf_score": 0.9132,
    "keyword_coverage": 0.75,
    "matched_keywords": ["machine", "python", "sql"]
  }
]
```

## Programmatic Usage (Core Engine)

```python
from core.ranker import rank_resumes

job_description = "Python SQL machine learning"
resumes = [
    {"candidate_id": "c1", "resume_text": "Python SQL machine learning pandas"},
    {"candidate_id": "c2", "resume_text": "Java Spring Boot"},
]

results = rank_resumes(job_description, resumes, tfidf_weight=0.8, keyword_weight=0.2)
print(results)
```

## Notes

- `configs/scoring_config.yaml` contains sample scoring weights and can be used for future config-driven loading.
- The API currently allows all CORS origins (`*`) for development convenience.
