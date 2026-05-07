import pytest

from app.processor import run_operation


def test_uppercase() -> None:
    assert run_operation("uppercase", "Hello") == "HELLO"


def test_lowercase() -> None:
    assert run_operation("lowercase", "Hello") == "hello"


def test_reverse() -> None:
    assert run_operation("reverse", "abc") == "cba"


def test_word_count() -> None:
    assert run_operation("word_count", "  build reliable systems  ") == 3


def test_unsupported_operation() -> None:
    with pytest.raises(ValueError):
        run_operation("capitalize", "Hello")
