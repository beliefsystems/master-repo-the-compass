<script lang="ts">
  import "../app.css";

  let { data, children } = $props();
</script>

<svelte:head>
  <title>THE COMPASS</title>
  <meta name="description" content="THE COMPASS performance management system" />
</svelte:head>

{@render children()}
