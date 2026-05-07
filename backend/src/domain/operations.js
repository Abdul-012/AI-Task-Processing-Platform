export const SUPPORTED_OPERATIONS = [
  "uppercase",
  "lowercase",
  "reverse",
  "word_count"
];

export function runTextOperation(operation, inputText) {
  switch (operation) {
    case "uppercase":
      return inputText.toUpperCase();
    case "lowercase":
      return inputText.toLowerCase();
    case "reverse":
      return [...inputText].reverse().join("");
    case "word_count":
      return inputText.trim() === "" ? 0 : inputText.trim().split(/\s+/).length;
    default:
      throw new Error(`Unsupported operation: ${operation}`);
  }
}
