import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

type GoogleCredentialResponse = { credential: string };

// Google Identity Services attaches itself to window.google once its script loads —
// there's no npm package for this, so it's typed loosely here rather than pulling in
// a whole @types package for one callback shape.
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

function GoogleSignInButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  // Every keystroke in the login form re-renders LoginRoute, which would otherwise
  // hand this effect a new onCredential reference and re-run the script/render setup
  // on every keystroke. A ref keeps the effect mount-only while still calling latest.
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current) {
      return;
    }

    let cancelled = false;

    const render = () => {
      if (cancelled || !window.google || !buttonRef.current) {
        return;
      }
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => onCredentialRef.current(response.credential),
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
      });
    };

    if (window.google) {
      render();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = render;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="rounded-full border border-dashed border-border px-4 py-2.5 text-center text-sm text-zinc-500 dark:border-white/10 dark:text-slate-500">
        Google sign-in isn&apos;t configured yet
      </div>
    );
  }

  return <div ref={buttonRef} className="flex justify-center" />;
}

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

  const handleGoogleCredential = async (credential: string) => {
    setError(null);
    try {
      const authResponse = await api.auth.google(credential);
      setAuth(authResponse.user, authResponse.access_token);
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    }
  };

  return (
    <div className="min-h-screen bg-background text-zinc-900 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full border border-accent/25 bg-panel text-accent shadow-sm">
                <div className="h-5 w-5 rounded-full border-4 border-dotted border-accent" />
              </div>
              <div>
                <div className="font-heading text-2xl font-semibold tracking-[-0.05em] text-zinc-900 dark:text-white">
                  EngIntel
                </div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500 dark:text-slate-500">
                  Engineering wire
                </div>
              </div>
            </div>
            <div className="inline-flex items-center rounded-full border border-border bg-panel px-3 py-1 text-sm text-zinc-600 dark:border-white/10 dark:text-slate-300">
              Tech news • AI signals • fast context
            </div>
            <div className="space-y-3">
              <h1 className="font-heading text-2xl font-semibold leading-[1.15] tracking-[-0.05em] text-zinc-900 dark:text-white sm:text-3xl">
                See the stories shaping engineering before the noise catches up.
              </h1>
              <p className="max-w-md text-sm leading-6 text-zinc-700 dark:text-slate-300">
                Follow the signal across product launches, security incidents, infrastructure shifts, and developer tools.
              </p>
            </div>
          </div>

          <div className="border border-border bg-panel p-5 shadow-panel dark:border-white/10">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 dark:text-slate-500">Access portal</p>
                <h2 className="font-heading text-xl font-semibold text-zinc-900 dark:text-white">
                  {mode === "signup" ? "Create account" : "Sign in"}
                </h2>
              </div>
              <div className="rounded-full border border-border bg-background/40 px-3 py-1 text-sm text-zinc-600 dark:border-white/10 dark:text-slate-400">
                {mode === "signup" ? "New here" : "Returning"}
              </div>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit}>
              {mode === "signup" ? (
                <div>
                  <label className="mb-2 block text-sm text-zinc-600 dark:text-slate-400" htmlFor="displayName">
                    Display name
                  </label>
                  <input
                    id="displayName"
                    className="w-full border border-border bg-background/40 px-4 py-2.5 text-sm text-zinc-900 outline-none ring-0 focus:border-accent/50 dark:border-white/10 dark:text-slate-100"
                    placeholder="Alex Chen"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                  />
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm text-zinc-600 dark:text-slate-400" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full border border-border bg-background/40 px-4 py-2.5 text-sm text-zinc-900 outline-none ring-0 focus:border-accent/50 dark:border-white/10 dark:text-slate-100"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-600 dark:text-slate-400" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full border border-border bg-background/40 px-4 py-2.5 text-sm text-zinc-900 outline-none ring-0 focus:border-accent/50 dark:border-white/10 dark:text-slate-100"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {error ? <p className="text-sm text-critical">{error}</p> : null}

              <button
                type="submit"
                className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Working..." : mode === "signup" ? "Create account" : "Sign in"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-slate-600">
              <div className="h-px flex-1 bg-border dark:bg-white/10" />
              or
              <div className="h-px flex-1 bg-border dark:bg-white/10" />
            </div>

            <GoogleSignInButton onCredential={(credential) => void handleGoogleCredential(credential)} />

            <div className="mt-5 flex items-center justify-between text-sm text-zinc-600 dark:text-slate-400">
              <span>{mode === "signup" ? "Already have an account?" : "Need an account?"}</span>
              <button
                type="button"
                className="font-medium text-accent transition hover:opacity-80"
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
