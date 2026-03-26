from typing import Sequence

from scipy.sparse import csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer

from .preprocessing import normalize_text


def build_tfidf_matrix(job_description: str, resume_texts: Sequence[str]) -> tuple[TfidfVectorizer, csr_matrix]:
    documents = [job_description, *resume_texts]
    normalized_docs = [normalize_text(doc) for doc in documents]
    vectorizer = TfidfVectorizer(ngram_range=(1, 2))
    matrix = vectorizer.fit_transform(normalized_docs)
    return vectorizer, matrix
