from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.ranker import rank_resumes


def main() -> None:
    job_description = (
        "Looking for a Python developer with SQL, machine learning, NLP, and API integration experience."
    )
    resumes = [
        {
            "candidate_id": "cand_001",
            "resume_text": "Python SQL machine learning NLP scikit-learn Flask REST APIs.",
        },
        {
            "candidate_id": "cand_002",
            "resume_text": "Java Spring Boot microservices Kubernetes Docker.",
        },
        {
            "candidate_id": "cand_003",
            "resume_text": "Python data analysis pandas numpy SQL reporting.",
        },
    ]
    results = rank_resumes(job_description, resumes)
    for row in results:
        print(row)


if __name__ == "__main__":
    main()
