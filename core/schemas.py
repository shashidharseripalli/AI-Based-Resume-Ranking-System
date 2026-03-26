from dataclasses import dataclass, field
from typing import List


@dataclass(frozen=True)
class CandidateResume:
    candidate_id: str
    resume_text: str


@dataclass(frozen=True)
class CandidateScore:
    candidate_id: str
    score: float
    tfidf_score: float
    keyword_coverage: float
    matched_keywords: List[str] = field(default_factory=list)
