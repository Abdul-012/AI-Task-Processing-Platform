import { Play, TextCursorInput } from "lucide-react";
import { FormEvent, useState } from "react";
import type { Operation } from "../types/api";

interface TaskComposerProps {
  onCreate(input: { title: string; inputText: string; operation: Operation }): Promise<void>;
}

const operationLabels: Array<{ value: Operation; label: string }> = [
  { value: "uppercase", label: "Uppercase" },
  { value: "lowercase", label: "Lowercase" },
  { value: "reverse", label: "Reverse" },
  { value: "word_count", label: "Word count" }
];

export function TaskComposer({ onCreate }: TaskComposerProps) {
  const [title, setTitle] = useState("");
  const [inputText, setInputText] = useState("");
  const [operation, setOperation] = useState<Operation>("uppercase");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await onCreate({ title, inputText, operation });
      setTitle("");
      setInputText("");
      setOperation("uppercase");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel composer" aria-labelledby="compose-title">
      <div className="section-heading">
        <TextCursorInput size={20} aria-hidden="true" />
        <h2 id="compose-title">New task</h2>
      </div>

      <form onSubmit={handleSubmit} className="stack">
        <label>
          <span>Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            minLength={2}
            maxLength={120}
            required
          />
        </label>

        <fieldset>
          <legend>Operation</legend>
          <div className="operation-grid">
            {operationLabels.map((item) => (
              <button
                key={item.value}
                className={operation === item.value ? "active" : ""}
                type="button"
                onClick={() => setOperation(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label>
          <span>Input text</span>
          <textarea
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            rows={9}
            maxLength={10000}
            required
          />
        </label>

        <button className="primary-action" type="submit" disabled={submitting}>
          <Play size={18} aria-hidden="true" />
          {submitting ? "Queueing" : "Run task"}
        </button>
      </form>
    </section>
  );
}
