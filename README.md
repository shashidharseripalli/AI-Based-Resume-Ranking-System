# AI Based Resume Ranking System (Core Module)

This repository contains the core ranking engine for matching resumes against a job description using:

- text preprocessing
- TF-IDF vectorization
- cosine similarity
- keyword coverage scoring

## Project Structure

- `core/`: ranking engine code
- `tests/`: unit tests for preprocessing, scoring, and ranking
- `scripts/run_core_demo.py`: quick runnable demo
- `configs/scoring_config.yaml`: default scoring weights
- `data/`: small sample inputs

## Setup

```powershell
python -m venv venv
.\venv\Scripts\python -m pip install -r requirements.txt
```

## Run Demo

```powershell
.\venv\Scripts\python scripts\run_core_demo.py
```

## Run Tests

```powershell
.\venv\Scripts\python -m pytest -q
```

## Frontend (HTML/CSS/JS)

A ready-to-use frontend is available in `frontend/`:

- `frontend/index.html`
- `frontend/styles.css`
- `frontend/app.js`

Open `frontend/index.html` in a browser, then set your backend base URL (default: `http://localhost:8000`).

The frontend sends:

- `POST /api/rank`
- JSON body:
  - `job_description: string`
  - `resumes: [{ candidate_id: string, resume_text: string }]`
  - `tfidf_weight: number`
  - `keyword_weight: number`

It accepts either:

- an array response (`[ { candidate_id, score, ... } ]`)
- or an object with `results` array (`{ "results": [ ... ] }`)

## Core API

Use `core.ranker.rank_resumes`:

```python
from core.ranker import rank_resumes

job_description = "Python SQL machine learning"
resumes = [
    {"candidate_id": "c1", "resume_text": "Python SQL machine learning pandas"},
    {"candidate_id": "c2", "resume_text": "Java Spring Boot"},
]

results = rank_resumes(job_description, resumes)
print(results)
```

Each result includes:
- `candidate_id`
- `score` (0-100)
- `tfidf_score` (0-1)
- `keyword_coverage` (0-1)
- `matched_keywords`
