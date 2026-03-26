from core.ranker import rank_resumes


def test_rank_resumes_orders_best_match_first() -> None:
    job_description = "Python SQL machine learning"
    resumes = [
        {"candidate_id": "c1", "resume_text": "Python SQL machine learning pandas"},
        {"candidate_id": "c2", "resume_text": "Java Spring Boot"},
    ]
    results = rank_resumes(job_description, resumes)
    assert results[0]["candidate_id"] == "c1"
    assert results[0]["score"] >= results[1]["score"]


def test_rank_resumes_requires_candidate_id() -> None:
    job_description = "Python SQL"
    resumes = [{"resume_text": "Python SQL"}]
    try:
        rank_resumes(job_description, resumes)
    except ValueError:
        assert True
    else:
        assert False, "Expected ValueError when candidate_id is missing."
