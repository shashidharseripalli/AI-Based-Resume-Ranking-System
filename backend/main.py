from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from core.ranker import rank_resumes


class ResumeIn(BaseModel):
    candidate_id: str = Field(min_length=1)
    resume_text: str


class RankRequest(BaseModel):
    job_description: str = Field(min_length=1)
    resumes: List[ResumeIn] = Field(min_length=1)
    tfidf_weight: float = 0.8
    keyword_weight: float = 0.2


app = FastAPI(title="Resume Ranking API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/rank")
def rank(payload: RankRequest):
    try:
        return rank_resumes(
            job_description=payload.job_description,
            resumes=[resume.model_dump() for resume in payload.resumes],
            tfidf_weight=payload.tfidf_weight,
            keyword_weight=payload.keyword_weight,
        )
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Ranking failed: {exc}") from exc
