<script lang="ts">
  let { data, form } = $props();

  let pendingForm = $state<string | null>(null);
  const canWrite = $derived(data.user?.role === "ADMIN" && !data.user?.executiveLabel);
  const kpiStatusBandsJson = $derived(JSON.stringify(data.config.kpiStatusBands, null, 2));
  const pmsRatingBandsJson = $derived(JSON.stringify(data.config.pmsRatingBands, null, 2));
  const cadenceOptions = ["QUARTERLY", "HALF_YEARLY", "ANNUAL"] as const;

  function startSubmit(formName: string) {
    pendingForm = formName;
  }
</script>

<div class="mx-auto min-h-screen max-w-6xl px-6 py-8">
  <header class="mb-8 flex flex-wrap items-center justify-between gap-4">
    <div>
      <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Settings</p>
      <h1 class="mt-2 font-[var(--font-serif)] text-4xl text-slate-800">Organisation configuration</h1>
    </div>
    <a class="clay-button bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-slate-800" href="/app">
      Back
    </a>
  </header>

  {#if form?.message}
    <p class="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
      {form.message}
    </p>
  {/if}

  {#if form?.fields?.length}
    <div class="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {#each form.fields as field}
        <p><span class="font-semibold">{field.field}:</span> {field.message}</p>
      {/each}
    </div>
  {/if}

  <div class="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
    <form
      class="clay-card p-6"
      method="POST"
      action="?/organisation"
      onsubmit={() => startSubmit("organisation")}
    >
      <div class="mb-6 flex items-center justify-between gap-4">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Profile</p>
          <h2 class="mt-2 text-2xl font-semibold text-slate-800">Organisation</h2>
        </div>
        <span class="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-slate-600">{data.organisation.status}</span>
      </div>

      <input type="hidden" name="version" value={data.organisation.version} />

      <label class="block text-sm font-medium text-slate-700" for="name">Name</label>
      <input
        class="clay-input mt-2 w-full px-4 py-3 text-base text-slate-800 disabled:opacity-70"
        id="name"
        name="name"
        type="text"
        value={data.organisation.name}
        disabled={!canWrite}
        required
      />

      <label class="mt-5 block text-sm font-medium text-slate-700" for="timezone">Timezone</label>
      <input
        class="clay-input mt-2 w-full px-4 py-3 text-base text-slate-800 disabled:opacity-70"
        id="timezone"
        name="timezone"
        type="text"
        value={data.organisation.timezone}
        disabled={!canWrite}
        required
      />

      <label class="mt-5 block text-sm font-medium text-slate-700" for="fiscalYearStart">Fiscal year start</label>
      <input
        class="clay-input mt-2 w-full px-4 py-3 text-base text-slate-800 opacity-70"
        id="fiscalYearStart"
        type="text"
        value={data.organisation.fiscalYearStart}
        disabled
      />

      {#if canWrite}
        <button
          class="clay-button mt-6 w-full bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
          type="submit"
          disabled={pendingForm === "organisation"}
        >
          {pendingForm === "organisation" ? "Saving..." : "Save organisation"}
        </button>
      {/if}
    </form>

    <form class="clay-card p-6" method="POST" action="?/config" onsubmit={() => startSubmit("config")}>
      <div class="mb-6">
        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Runtime</p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-800">Configuration</h2>
      </div>

      <input type="hidden" name="version" value={data.config.version} />

      <label class="block text-sm font-medium text-slate-700" for="maxImportFileSizeMb">Max import file size MB</label>
      <input
        class="clay-input mt-2 w-full px-4 py-3 text-base text-slate-800 disabled:opacity-70"
        id="maxImportFileSizeMb"
        name="maxImportFileSizeMb"
        type="number"
        min="1"
        value={data.config.maxImportFileSizeMb}
        disabled={!canWrite}
        required
      />

      <fieldset class="mt-5">
        <legend class="text-sm font-medium text-slate-700">PMS cadences</legend>
        <div class="mt-3 grid gap-2 sm:grid-cols-3">
          {#each cadenceOptions as cadence}
            <label class="flex items-center gap-2 rounded-xl bg-stone-200/70 px-3 py-3 text-sm font-semibold text-slate-700">
              <input
                class="h-4 w-4 accent-[var(--primary)]"
                type="checkbox"
                name="pmsCadencesEnabled"
                value={cadence}
                checked={data.config.pmsCadencesEnabled.includes(cadence)}
                disabled={!canWrite}
              />
              {cadence}
            </label>
          {/each}
        </div>
      </fieldset>

      <label class="mt-5 block text-sm font-medium text-slate-700" for="kpiStatusBands">KPI status bands</label>
      <textarea
        class="clay-input mt-2 min-h-44 w-full px-4 py-3 font-[var(--font-mono)] text-sm text-slate-800 disabled:opacity-70"
        id="kpiStatusBands"
        name="kpiStatusBands"
        disabled={!canWrite}
      >{kpiStatusBandsJson}</textarea>

      <label class="mt-5 block text-sm font-medium text-slate-700" for="pmsRatingBands">PMS rating bands</label>
      <textarea
        class="clay-input mt-2 min-h-36 w-full px-4 py-3 font-[var(--font-mono)] text-sm text-slate-800 disabled:opacity-70"
        id="pmsRatingBands"
        name="pmsRatingBands"
        disabled={!canWrite}
      >{pmsRatingBandsJson}</textarea>

      {#if canWrite}
        <button
          class="clay-button mt-6 w-full bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
          type="submit"
          disabled={pendingForm === "config"}
        >
          {pendingForm === "config" ? "Saving..." : "Save configuration"}
        </button>
      {/if}
    </form>
  </div>
</div>
