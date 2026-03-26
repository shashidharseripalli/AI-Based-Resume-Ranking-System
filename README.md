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
