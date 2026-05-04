<script lang="ts">
  let { data, form } = $props();

  const canWrite = $derived(data.user?.role === "ADMIN" && !data.user?.executiveLabel);
</script>

<div class="mx-auto min-h-screen max-w-6xl px-6 py-8">
  <header class="mb-8 flex flex-wrap items-center justify-between gap-4">
    <div>
      <p class="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">People</p>
      <h1 class="mt-2 font-[var(--font-serif)] text-4xl text-slate-800">Users and employees</h1>
    </div>
    <a class="clay-button bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-slate-800" href="/app">Back</a>
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

  <div class="grid gap-6 lg:grid-cols-2">
    <section class="clay-card p-6">
      <div class="mb-5 flex items-center justify-between gap-3">
        <h2 class="text-2xl font-semibold text-slate-800">Users</h2>
        <span class="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-slate-600">{data.users.length}</span>
      </div>

      {#if canWrite}
        <form class="mb-6 grid gap-3" method="POST" action="?/createUser">
          <input class="clay-input px-4 py-3" name="fullName" placeholder="Full name" required />
          <div class="grid gap-3 sm:grid-cols-2">
            <input class="clay-input px-4 py-3" name="email" placeholder="Email" type="email" required />
            <input class="clay-input px-4 py-3" name="username" placeholder="Username" required />
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <input class="clay-input px-4 py-3" name="password" placeholder="Temporary password" type="password" minlength="8" required />
            <select class="clay-input px-4 py-3" name="role" required>
              <option value="EMPLOYEE">EMPLOYEE</option>
              <option value="MANAGER">MANAGER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <label class="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input class="h-4 w-4 accent-[var(--primary)]" type="checkbox" name="executiveLabel" />
            Executive read-only label
          </label>
          <button class="clay-button bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white" type="submit">Create user</button>
        </form>
      {/if}

      <div class="space-y-3">
        {#each data.users as user}
          <form class="rounded-xl bg-stone-200/70 p-4" method="POST" action="?/updateUser">
            <input type="hidden" name="id" value={user.id} />
            <input type="hidden" name="version" value={user.version} />
            <div class="grid gap-3 sm:grid-cols-2">
              <input class="clay-input px-3 py-2" name="fullName" value={user.fullName} disabled={!canWrite} />
              <input class="clay-input px-3 py-2" name="email" type="email" value={user.email} disabled={!canWrite} />
              <input class="clay-input px-3 py-2" name="username" value={user.username} disabled={!canWrite} />
              <select class="clay-input px-3 py-2" name="role" disabled={!canWrite}>
                {#each ["ADMIN", "MANAGER", "EMPLOYEE"] as role}
                  <option value={role} selected={user.role === role}>{role}</option>
                {/each}
              </select>
              <select class="clay-input px-3 py-2" name="status" disabled={!canWrite}>
                {#each ["ACTIVE", "DEACTIVATED"] as status}
                  <option value={status} selected={user.status === status}>{status}</option>
                {/each}
              </select>
              {#if canWrite}
                <button class="clay-button bg-[var(--secondary)] px-3 py-2 text-sm font-semibold text-slate-800" type="submit">
                  Save user
                </button>
              {/if}
            </div>
          </form>
        {/each}
      </div>
    </section>

    <section class="clay-card p-6">
      <div class="mb-5 flex items-center justify-between gap-3">
        <h2 class="text-2xl font-semibold text-slate-800">Employees</h2>
        <span class="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-slate-600">{data.employees.length}</span>
      </div>

      {#if canWrite}
        <form class="mb-6 grid gap-3" method="POST" action="?/createEmployee">
          <select class="clay-input px-4 py-3" name="userId" required>
            <option value="">User</option>
            {#each data.users as user}
              <option value={user.id}>{user.fullName} ({user.role})</option>
            {/each}
          </select>
          <select class="clay-input px-4 py-3" name="managerId">
            <option value="">No manager</option>
            {#each data.employees as employee}
              <option value={employee.id}>{employee.fullName}</option>
            {/each}
          </select>
          <div class="grid gap-3 sm:grid-cols-2">
            <input class="clay-input px-4 py-3" name="employeeCode" placeholder="Employee code" required />
            <input class="clay-input px-4 py-3" name="fullName" placeholder="Full name" required />
            <input class="clay-input px-4 py-3" name="department" placeholder="Department" />
            <input class="clay-input px-4 py-3" name="designation" placeholder="Designation" />
          </div>
          <button class="clay-button bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white" type="submit">Create employee</button>
        </form>
      {/if}

      <div class="space-y-3">
        {#each data.employees as employee}
          <form class="rounded-xl bg-stone-200/70 p-4" method="POST" action="?/updateEmployee">
            <input type="hidden" name="id" value={employee.id} />
            <input type="hidden" name="version" value={employee.version} />
            <div class="grid gap-3 sm:grid-cols-2">
              <input class="clay-input px-3 py-2" name="fullName" value={employee.fullName} disabled={!canWrite} />
              <input class="clay-input px-3 py-2" value={employee.employeeCode} disabled />
              <select class="clay-input px-3 py-2" name="managerId" disabled={!canWrite}>
                <option value="">No manager</option>
                {#each data.employees.filter((item) => item.id !== employee.id) as manager}
                  <option value={manager.id} selected={employee.managerId === manager.id}>{manager.fullName}</option>
                {/each}
              </select>
              <select class="clay-input px-3 py-2" name="status" disabled={!canWrite}>
                {#each ["ACTIVE", "DEACTIVATED"] as status}
                  <option value={status} selected={employee.status === status}>{status}</option>
                {/each}
              </select>
              <input class="clay-input px-3 py-2" name="department" value={employee.department ?? ""} disabled={!canWrite} />
              <input class="clay-input px-3 py-2" name="designation" value={employee.designation ?? ""} disabled={!canWrite} />
              {#if canWrite}
                <button class="clay-button bg-[var(--secondary)] px-3 py-2 text-sm font-semibold text-slate-800" type="submit">
                  Save employee
                </button>
              {/if}
            </div>
          </form>
        {/each}
      </div>
    </section>
  </div>

  <section class="clay-card mt-6 p-6">
    <h2 class="mb-4 text-2xl font-semibold text-slate-800">Org chart</h2>
    <pre class="overflow-x-auto rounded-[1rem] bg-stone-200/70 p-4 font-[var(--font-mono)] text-sm text-slate-800">{JSON.stringify(data.orgChart, null, 2)}</pre>
  </section>
</div>
