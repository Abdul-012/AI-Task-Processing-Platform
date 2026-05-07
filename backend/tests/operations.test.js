import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runTextOperation } from "../src/domain/operations.js";

describe("runTextOperation", () => {
  it("uppercases input text", () => {
    assert.equal(runTextOperation("uppercase", "Hello"), "HELLO");
  });

  it("lowercases input text", () => {
    assert.equal(runTextOperation("lowercase", "Hello"), "hello");
  });

  it("reverses unicode-aware input text", () => {
    assert.equal(runTextOperation("reverse", "abc"), "cba");
  });

  it("counts words without counting surrounding whitespace", () => {
    assert.equal(runTextOperation("word_count", "  build reliable systems  "), 3);
  });
});
