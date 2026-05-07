SUPPORTED_OPERATIONS = {"uppercase", "lowercase", "reverse", "word_count"}


def run_operation(operation: str, input_text: str) -> str | int:
    if operation == "uppercase":
        return input_text.upper()

    if operation == "lowercase":
        return input_text.lower()

    if operation == "reverse":
        return "".join(reversed(input_text))

    if operation == "word_count":
        stripped = input_text.strip()
        return 0 if stripped == "" else len(stripped.split())

    raise ValueError(f"Unsupported operation: {operation}")
