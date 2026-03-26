from typing import Dict, List, Sequence

from sklearn.metrics.pairwise import cosine_similarity

from .preprocessing import extract_keywords, normalize_text
from .schemas import CandidateResume, CandidateScore
from .vectorizer import build_tfidf_matrix


def compute_keyword_coverage(jd_keywords: set[str], resume_keywords: set[str]) -> float:
    if not jd_keywords:
        return 0.0
    return len(jd_keywords & resume_keywords) / len(jd_keywords)


def score_resumes(
    job_description: str,
    resumes: Sequence[CandidateResume],
    tfidf_weight: float = 0.8,
    keyword_weight: float = 0.2,
) -> List[CandidateScore]:
    if not resumes:
        return []
    if tfidf_weight < 0 or keyword_weight < 0:
        raise ValueError("Weights cannot be negative.")

    weight_sum = tfidf_weight + keyword_weight
    if weight_sum <= 0:
        raise ValueError("Weights must sum to a positive value.")

    tfidf_weight /= weight_sum
    keyword_weight /= weight_sum

    resume_texts = [resume.resume_text for resume in resumes]
    normalized_jd = normalize_text(job_description)
    normalized_resumes = [normalize_text(text) for text in resume_texts]

    if normalized_jd or any(normalized_resumes):
        _, matrix = build_tfidf_matrix(job_description, resume_texts)
        jd_vector = matrix[0]
        resume_vectors = matrix[1:]
        tfidf_similarities = cosine_similarity(jd_vector, resume_vectors).flatten()
    else:
        tfidf_similarities = [0.0 for _ in resumes]

    jd_keywords = extract_keywords(job_description)
    resume_keywords_list = [extract_keywords(resume.resume_text) for resume in resumes]
    keyword_coverages = [
        compute_keyword_coverage(jd_keywords, resume_keywords)
        for resume_keywords in resume_keywords_list
    ]

    scores: List[CandidateScore] = []
    for index, resume in enumerate(resumes):
        tfidf_score = float(tfidf_similarities[index])
        keyword_coverage = float(keyword_coverages[index])
        blended_score = (tfidf_weight * tfidf_score) + (keyword_weight * keyword_coverage)
        matched_keywords = sorted(list(jd_keywords & resume_keywords_list[index]))

        scores.append(
            CandidateScore(
                candidate_id=resume.candidate_id,
                score=round(blended_score * 100.0, 2),
                tfidf_score=round(tfidf_score, 4),
                keyword_coverage=round(keyword_coverage, 4),
                matched_keywords=matched_keywords,
            )
        )

    return scores


def rank_candidate_scores(scores: Sequence[CandidateScore]) -> List[CandidateScore]:
    return sorted(scores, key=lambda item: item.score, reverse=True)


def score_as_dicts(scores: Sequence[CandidateScore]) -> List[Dict[str, object]]:
    return [
        {
            "candidate_id": score.candidate_id,
            "score": score.score,
            "tfidf_score": score.tfidf_score,
            "keyword_coverage": score.keyword_coverage,
            "matched_keywords": score.matched_keywords,
        }
        for score in scores
    ]
