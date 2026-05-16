export function LoginRoute() {
  return (
    <section className="border border-border bg-panel p-6 dark:border-white/10">
      <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500 dark:text-slate-500">Authentication</div>
      <h1 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.05em] text-zinc-900 dark:text-white">
        Secure access for saved workflows and alerts.
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-700 dark:text-slate-300">
        The auth surface is scaffolded for email-password login today and is ready to expand to OAuth or SSO for team
        subscriptions, digest preferences, and private briefing views.
      </p>
    </section>
  );
}
