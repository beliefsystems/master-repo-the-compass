<script lang="ts">
  let { form } = $props();
</script>

<div class="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-10">
  <div class="clay-card grid w-full max-w-4xl overflow-hidden md:grid-cols-[1.2fr_0.8fr]">
    <section class="hidden bg-[linear-gradient(160deg,rgba(99,102,241,0.12),rgba(255,255,255,0.6))] p-8 md:flex md:flex-col md:justify-between">
      <div>
        <p class="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">THE COMPASS</p>
        <h1 class="mt-6 font-[var(--font-serif)] text-4xl leading-tight text-slate-800">
          Performance management with a lighter operational core.
        </h1>
      </div>
      <p class="max-w-sm text-sm leading-7 text-slate-600">
        Slice 0 keeps the shell intentionally minimal so runtime speed, auth wiring, and backend correctness stay first.
      </p>
    </section>

    <section class="p-6 sm:p-8">
      <div class="mx-auto max-w-md">
        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Login</p>
        <h2 class="mt-3 text-3xl font-semibold text-slate-800">Developer access</h2>
        <p class="mt-3 text-sm leading-7 text-slate-600">
          Use the seeded local credentials to verify the BetterAuth flow and protected route behavior.
        </p>

        <form method="POST" class="mt-8 space-y-4">
          <label class="block text-sm font-medium text-slate-700" for="email">Email or username</label>
          <input
            class="clay-input w-full px-4 py-3 text-base text-slate-800"
            id="email"
            name="email"
            type="text"
            value={form?.values?.email ?? ""}
            autocomplete="username"
            required
          />

          <label class="block text-sm font-medium text-slate-700" for="password">Password</label>
          <input
            class="clay-input w-full px-4 py-3 text-base text-slate-800"
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
          />

          {#if form?.message}
            <p class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{form.message}</p>
          {/if}

          <button
            class="clay-button mt-2 w-full bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white"
            type="submit"
          >
            Sign in
          </button>
        </form>
      </div>
    </section>
  </div>
</div>
