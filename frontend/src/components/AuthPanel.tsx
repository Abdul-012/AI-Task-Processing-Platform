import { LockKeyhole, Mail, User, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { api, ApiError } from "../lib/api";
import type { User as UserType } from "../types/api";

interface AuthPanelProps {
  onAuthenticated(user: UserType, token: string): void;
}

export function AuthPanel({ onAuthenticated }: AuthPanelProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload =
        mode === "register"
          ? await api.register({ name, email, password })
          : await api.login({ email, password });

      onAuthenticated(payload.user, payload.token);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Authentication failed"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-brand" aria-labelledby="brand-title">
        <div className="brand-mark">TF</div>
        <div>
          <p className="eyebrow">AI Task Processing Platform</p>
          <h1 id="brand-title">TaskForge</h1>
          <p className="brand-copy">
            Queue text jobs, watch worker progress, and inspect every result from one focused console.
          </p>
        </div>
      </section>

      <section className="auth-panel" aria-label="Authentication form">
        <div className="segmented" role="tablist" aria-label="Authentication mode">
          <button
            className={mode === "login" ? "active" : ""}
            type="button"
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            type="button"
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="stack">
          {mode === "register" ? (
            <label>
              <span>Name</span>
              <div className="input-wrap">
                <User size={18} aria-hidden="true" />
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  minLength={2}
                  required
                />
              </div>
            </label>
          ) : null}

          <label>
            <span>Email</span>
            <div className="input-wrap">
              <Mail size={18} aria-hidden="true" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label>
            <span>Password</span>
            <div className="input-wrap">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                minLength={8}
                required
              />
            </div>
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-action" type="submit" disabled={submitting}>
            <UserPlus size={18} aria-hidden="true" />
            {submitting ? "Please wait" : mode === "register" ? "Create account" : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
