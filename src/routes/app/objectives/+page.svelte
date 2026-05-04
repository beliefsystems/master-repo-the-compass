<script lang="ts">
  let { data, form } = $props();

  const canWrite = $derived((data.user?.role === "ADMIN" || data.user?.role === "MANAGER") && !data.user?.executiveLabel);
  const canDelete = $derived(data.user?.role === "ADMIN" && !data.user?.executiveLabel);
  const totalWeightage = $derived(
    data.objectives.reduce((sum, objective) => Number((sum + Number(objective.weightage)).toFixed(2)), 0)
  );
  const objectiveTitleOptions = ["Revenue Contribution", "Cost Optimization", "Operational Efficiency"] as const;
  let createTitleChoice = $state<(typeof objectiveTitleOptions)[number] | "Others">("Revenue Contribution");

  function titleChoiceFor(title: string) {
    return objectiveTitleOptions.includes(title as (typeof objectiveTitleOptions)[number]) ? title : "Others";
  }
</script>

<div class="mx-auto min-h-screen max-w-6xl px-6 py-8">
  <header class="mb-8 flex flex-wrap items-center justify-between gap-4">
    <div>
      <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Objectives</p>
      <h1 class="mt-2 font-[var(--font-serif)] text-4xl text-slate-800">Objective weightage</h1>
    </div>
    <a class="clay-button bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-slate-800" href="/app">Back</a>
  </header>

  {#if form?.message}
    <p class="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
      {form.message}
      {#if form.weightages}
        <span class="ml-2 font-[var(--font-mono)]">{form.weightages.join(", ")}</span>
      {/if}
    </p>
  {/if}

  {#if form?.fields?.length}
    <div class="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {#each form.fields as field}
        <p><span class="font-semibold">{field.field}:</span> {field.message}</p>
      {/each}
    </div>
  {/if}

  <form class="clay-card mb-6 grid gap-3 p-6 md:grid-cols-[1fr_8rem_10rem_auto]" method="GET">
    <select class="clay-input px-4 py-3" name="employee_id" required>
      {#each data.employees as employee}
        <option value={employee.id} selected={data.selected.employeeId === employee.id}>
          {employee.fullName} ({employee.employeeCode})
        </option>
      {/each}
    </select>
    <input class="clay-input px-4 py-3" name="month" type="number" min="1" max="12" value={data.selected.month} required />
    <input class="clay-input px-4 py-3" name="fiscal_year" type="number" min="2000" max="9999" value={data.selected.fiscalYear} required />
    <button class="clay-button bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-slate-800" type="submit">Load</button>
  </form>

  <section class="clay-card mb-6 p-6">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-2xl font-semibold text-slate-800">Month plan</h2>
      <span class="rounded-full px-3 py-1 text-xs font-semibold {totalWeightage === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}">
        Total {totalWeightage.toFixed(2)}
      </span>
    </div>

    {#if canWrite && data.selected.employeeId}
      <form class="mb-6 grid gap-3 md:grid-cols-[1fr_8rem_auto]" method="POST" action="?/createObjective">
        <input type="hidden" name="employeeId" value={data.selected.employeeId} />
        <input type="hidden" name="month" value={data.selected.month} />
        <input type="hidden" name="fiscalYear" value={data.selected.fiscalYear} />
        <select class="clay-input px-4 py-3" name="titleChoice" bind:value={createTitleChoice} required>
          {#each objectiveTitleOptions as title}
            <option value={title}>{title}</option>
          {/each}
          <option value="Others">Others</option>
        </select>
        <input class="clay-input px-4 py-3" name="weightage" type="number" min="0" max="100" step="0.01" placeholder="100.00" required />
        <button class="clay-button bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white" type="submit">Create</button>
        {#if createTitleChoice === "Others"}
          <input class="clay-input px-4 py-3 md:col-span-3" name="customTitle" placeholder="Objective title" required />
        {/if}
        <textarea class="clay-input px-4 py-3 md:col-span-3" name="description" placeholder="Description"></textarea>
      </form>
    {/if}

    <div class="space-y-3">
      {#each data.objectives as objective}
        <form class="rounded-xl bg-stone-200/70 p-4" method="POST" action="?/updateObjective">
          <input type="hidden" name="id" value={objective.id} />
          <input type="hidden" name="version" value={objective.version} />
          <div class="grid gap-3 md:grid-cols-[1fr_8rem_10rem_auto]">
            <select class="clay-input px-3 py-2" name="titleChoice" disabled={!canWrite}>
              {#each objectiveTitleOptions as title}
                <option value={title} selected={objective.title === title}>{title}</option>
              {/each}
              <option value="Others" selected={titleChoiceFor(objective.title) === "Others"}>Others</option>
            </select>
            <input class="clay-input px-3 py-2" name="weightage" type="number" min="0" max="100" step="0.01" value={objective.weightage} disabled={!canWrite} />
            <select class="clay-input px-3 py-2" name="status" disabled={!canWrite}>
              {#each ["LAUNCHED", "ONGOING", "COMPLETED"] as status}
                <option value={status} selected={objective.status === status}>{status}</option>
              {/each}
            </select>
            {#if canWrite}
              <button class="clay-button bg-[var(--secondary)] px-3 py-2 text-sm font-semibold text-slate-800" type="submit">Save</button>
            {/if}
            <input class="clay-input px-3 py-2 md:col-span-4" name="customTitle" value={titleChoiceFor(objective.title) === "Others" ? objective.title : ""} placeholder="Required when Others is selected" disabled={!canWrite} />
            <textarea class="clay-input px-3 py-2 md:col-span-4" name="description" disabled={!canWrite}>{objective.description ?? ""}</textarea>
          </div>
        </form>
        {#if canDelete}
          <form class="pl-1" method="POST" action="?/deleteObjective">
            <input type="hidden" name="id" value={objective.id} />
            <input type="hidden" name="version" value={objective.version} />
            <button class="text-sm font-semibold text-red-700" type="submit">
              Are you sure you want to delete this objective? This action cannot be used once execution data exists.
            </button>
          </form>
        {/if}
      {/each}
    </div>
  </section>

  {#if canWrite}
    <form class="clay-card flex flex-wrap items-end gap-3 p-6" method="POST" action="?/autoSplit">
      <label class="block">
        <span class="text-sm font-medium text-slate-700">Auto-split count</span>
        <input class="clay-input mt-2 w-36 px-4 py-3" name="count" type="number" min="1" value={Math.max(data.objectives.length, 1)} required />
      </label>
      <button class="clay-button bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-slate-800" type="submit">Calculate</button>
    </form>
  {/if}
</div>
