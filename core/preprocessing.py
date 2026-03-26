import re
from typing import Iterable, List, Set

from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS


# Keep common skill tokens (e.g., c++, c#, node.js) while avoiding
# punctuation-only artifacts at token boundaries.
TOKEN_PATTERN = re.compile(r"[a-z0-9]+(?:[.-][a-z0-9]+|[+#]+|[+#][a-z0-9]+)*")


def clean_text(text: str) -> str:
    if text is None:
        return ""
    text = str(text).lower()
    text = re.sub(r"[^a-z0-9+#.\-\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def tokenize(text: str) -> List[str]:
    cleaned = clean_text(text)
    return TOKEN_PATTERN.findall(cleaned)


def remove_stopwords(tokens: Iterable[str]) -> List[str]:
    return [token for token in tokens if token not in ENGLISH_STOP_WORDS and len(token) > 1]


def normalize_text(text: str) -> str:
    return " ".join(remove_stopwords(tokenize(text)))


def extract_keywords(text: str) -> Set[str]:
    return set(remove_stopwords(tokenize(text)))
