from core.preprocessing import clean_text, normalize_text, tokenize


def test_tokenize_keeps_tech_tokens() -> None:
    tokens = tokenize("Python, C++, C#, Node.js, SQL.")
    assert "python" in tokens
    assert "c++" in tokens
    assert "c#" in tokens
    assert "node.js" in tokens
    assert "sql" in tokens


def test_clean_text_handles_none() -> None:
    assert clean_text(None) == ""


def test_normalize_text_removes_stopwords() -> None:
    normalized = normalize_text("The Python developer and the SQL engineer")
    assert "the" not in normalized.split()
    assert "python" in normalized.split()
