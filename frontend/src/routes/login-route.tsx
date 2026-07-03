import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function LoginRoute() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const authResponse =
        mode === "signup"
          ? await api.auth.register(email, password, displayName || email.split("@")[0])
          : await api.auth.login(email, password);

      setAuth(authResponse.user, authResponse.access_token);
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-sm text-slate-300">
              Tech news • AI signals • fast context
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                See the stories shaping engineering before the noise catches up.
              </h1>
              <p className="max-w-2xl text-lg text-slate-400">
                Follow the signal across product launches, security incidents, infrastructure shifts, and developer tools.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Access portal</p>
                <h2 className="text-xl font-semibold text-white">{mode === "signup" ? "Create account" : "Sign in"}</h2>
              </div>
              <div className="rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1 text-sm text-slate-400">
                {mode === "signup" ? "New here" : "Returning"}
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === "signup" ? (
                <div>
                  <label className="mb-2 block text-sm text-slate-400" htmlFor="displayName">
                    Display name
                  </label>
                  <input
                    id="displayName"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none ring-0"
                    placeholder="Alex Chen"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                  />
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm text-slate-400" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none ring-0"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-400" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none ring-0"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {error ? <p className="text-sm text-rose-400">{error}</p> : null}

              <button
                type="submit"
                className="w-full rounded-xl bg-sky-500 px-4 py-3 font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={loading}
              >
                {loading ? "Working..." : mode === "signup" ? "Create account" : "Sign in"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
              <span>{mode === "signup" ? "Already have an account?" : "Need an account?"}</span>
              <button
                type="button"
                className="font-medium text-slate-200 transition hover:text-white"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              >
                {mode === "signup" ? "Sign in" : "Create account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
