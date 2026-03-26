from typing import Dict, List, Sequence

from .schemas import CandidateResume
from .scorer import rank_candidate_scores, score_as_dicts, score_resumes


def rank_resumes(
    job_description: str,
    resumes: Sequence[CandidateResume | Dict[str, str]],
    tfidf_weight: float = 0.8,
    keyword_weight: float = 0.2,
) -> List[Dict[str, object]]:
    normalized_resumes: List[CandidateResume] = []
    for resume in resumes:
        if isinstance(resume, CandidateResume):
            normalized_resumes.append(resume)
            continue
        if not isinstance(resume, dict):
            raise TypeError("Each resume must be a CandidateResume or dict.")

        candidate_id = str(resume.get("candidate_id", "")).strip()
        resume_text = str(resume.get("resume_text", "")).strip()
        if not candidate_id:
            raise ValueError("Each resume must include a non-empty 'candidate_id'.")
        normalized_resumes.append(CandidateResume(candidate_id=candidate_id, resume_text=resume_text))

    scored = score_resumes(
        job_description=job_description,
        resumes=normalized_resumes,
        tfidf_weight=tfidf_weight,
        keyword_weight=keyword_weight,
    )
    ranked = rank_candidate_scores(scored)
    return score_as_dicts(ranked)
