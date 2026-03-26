from core.schemas import CandidateResume
from core.scorer import score_resumes


def test_score_resumes_returns_scores_for_all_candidates() -> None:
    resumes = [
        CandidateResume(candidate_id="c1", resume_text="Python SQL machine learning"),
        CandidateResume(candidate_id="c2", resume_text="Java Spring Boot"),
    ]
    scores = score_resumes("Python SQL", resumes)
    assert len(scores) == 2
    assert scores[0].candidate_id == "c1"


def test_score_resumes_normalizes_weights() -> None:
    resumes = [CandidateResume(candidate_id="c1", resume_text="Python SQL")]
    scores = score_resumes("Python SQL", resumes, tfidf_weight=8, keyword_weight=2)
    assert 0 <= scores[0].score <= 100
