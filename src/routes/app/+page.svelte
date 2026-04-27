<script lang="ts">
  let { data } = $props();

  async function handleSignOut() {
    await fetch("/api/v1/auth/logout", {
      method: "POST"
    });
    window.location.href = "/login";
  }
</script>

<div class="mx-auto min-h-screen max-w-6xl px-6 py-8">
  <header class="mb-8 flex items-center justify-between gap-4">
    <div>
      <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Protected Shell</p>
      <h1 class="mt-2 font-[var(--font-serif)] text-4xl text-slate-800">Runtime verification</h1>
    </div>
    <button class="clay-button bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-slate-800" onclick={handleSignOut}>
      Sign out
    </button>
  </header>

  <section class="clay-card p-6">
    <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">API Response</p>
    <pre class="mt-4 overflow-x-auto rounded-[1rem] bg-stone-200/70 p-4 font-[var(--font-mono)] text-sm text-slate-800">{JSON.stringify(data.organisation, null, 2)}</pre>
  </section>
</div>
