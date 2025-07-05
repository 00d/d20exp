<script>
  import { onMount } from 'svelte';

  let allSpells = [];
  let searchTerm = '';
  let selectedSpell = null;
  let isLoading = true;
  let error = null;

  // Fetch spells from our backend API on component mount
  onMount(async () => {
    try {
      const response = await fetch('/api/spells');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      allSpells = await response.json();
      if (!Array.isArray(allSpells)) {
        throw new Error("Data received is not an array. Check server logs.");
      }
    } catch (e) {
      console.error("Fetch error:", e);
      error = "Could not load spell data. Is the server running? Did you run `npm run scrape`?";
    } finally {
      isLoading = false;
    }
  });

  // A reactive declaration to filter spells based on the search term
  $: filteredSpells = allSpells.filter(spell =>
    spell.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function selectSpell(spell) {
    selectedSpell = spell;
    window.scrollTo(0, 0); // Scroll to top when a spell is selected
  }

  function clearSelection() {
    selectedSpell = null;
  }
</script>

<main>
  <h1>d20 SRD Spellbook</h1>

  {#if isLoading}
    <p>Loading spells...</p>
  {:else if error}
    <p style="color: #ff6b6b;">{error}</p>
  {:else if selectedSpell}
    <!-- Spell Detail View -->
    <button on:click={clearSelection}>&larr; Back to Spell List</button>
    <div class="spell-detail-view">
      <h2>{selectedSpell.name}</h2>
      
      <div class="spell-details-grid">
        {#each Object.entries(selectedSpell.details) as [key, value]}
          <div class="detail-item">
            <strong>{key.replace('_', ' ')}:</strong>
            <span>{value}</span>
          </div>
        {/each}
      </div>

      <h3>Description</h3>
      <pre>{selectedSpell.description || 'No description available.'}</pre>
      <p><a href={selectedSpell.url} target="_blank" rel="noopener noreferrer">View on d20srd.org</a></p>
    </div>
  {:else}
    <!-- Spell List View -->
    <div class="search-container">
      <input
        type="text"
        bind:value={searchTerm}
        placeholder="Search for a spell..."
        class="search-input"
      />
    </div>

    {#if filteredSpells.length > 0}
      <ul class="spell-list">
        {#each filteredSpells as spell (spell.name)}
          <li class="spell-list-item" on:click={() => selectSpell(spell)} on:keydown={(e) => e.key === 'Enter' && selectSpell(spell)} tabindex="0" role="button">
            {spell.name}
          </li>
        {/each}
      </ul>
    {:else}
      <p>No spells match your search.</p>
    {/if}
  {/if}
</main>
