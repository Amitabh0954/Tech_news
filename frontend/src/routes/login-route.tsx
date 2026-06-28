import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuthStore } from "@/stores/auth-store";

export function LoginRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const registeredUser = useAuthStore((state) => state.registeredUser);
  const registerAndLogin = useAuthStore((state) => state.registerAndLogin);
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const isNewUser = !registeredUser;
  const heading = isNewUser ? "Create your access password." : "Sign in with your saved account.";
  const helperText = isNewUser
    ? "This looks like the first visit on this browser. Enter your email and choose a password to unlock the app."
    : "Use the email and password that were saved the first time this browser was set up.";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError("Enter both email and password.");
      return;
    }

    if (isNewUser) {
      registerAndLogin({ email: trimmedEmail, password });
      navigate((location.state as { from?: string } | null)?.from ?? "/", { replace: true });
      return;
    }

    const result = login({ email: trimmedEmail, password });

    if (!result.success) {
      setError(result.error);
      return;
    }

    navigate((location.state as { from?: string } | null)?.from ?? "/", { replace: true });
  }

  return (
    <section className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="border border-border bg-panel p-8 dark:border-white/10">
        <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500 dark:text-slate-500">Authentication</div>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.05em] text-zinc-900 dark:text-white">
          {heading}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-700 dark:text-slate-300">{helperText}</p>

        <div className="mt-8 grid gap-4 border-t border-border pt-6 dark:border-white/10 sm:grid-cols-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-slate-500">
              Email
            </div>
            <p className="mt-2 text-sm text-zinc-700 dark:text-slate-300">Used as the saved login identity.</p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-slate-500">
              Password
            </div>
            <p className="mt-2 text-sm text-zinc-700 dark:text-slate-300">
              {isNewUser ? "Set it now on first visit." : "Enter the password already defined earlier."}
            </p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-slate-500">
              Storage
            </div>
            <p className="mt-2 text-sm text-zinc-700 dark:text-slate-300">Saved locally in this browser for now.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border border-border bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-950">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-slate-500">
          {isNewUser ? "First-time setup" : "Welcome back"}
        </div>
        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-800 dark:text-slate-200">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none transition focus:border-zinc-900 dark:border-white/10 dark:text-white dark:focus:border-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-800 dark:text-slate-200">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isNewUser ? "Choose a password" : "Enter your password"}
              className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none transition focus:border-zinc-900 dark:border-white/10 dark:text-white dark:focus:border-white"
            />
          </label>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        <button
          type="submit"
          className="mt-6 inline-flex w-full items-center justify-center bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-slate-200"
        >
          {isNewUser ? "Create Account" : "Log In"}
        </button>

        <p className="mt-4 text-xs leading-6 text-zinc-500 dark:text-slate-500">
          {isNewUser
            ? "After the first setup, this browser will treat you as an existing user and require the same saved password."
            : `Saved account: ${registeredUser?.email ?? ""}`}
        </p>
      </form>
    </section>
  );
}
