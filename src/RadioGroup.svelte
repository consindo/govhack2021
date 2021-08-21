<script>
  export let collection, group

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)

  const name = Math.random().toString()
</script>

<div>
  {#each collection as item}
    <label>
      <input type="radio" bind:group {name} value={item} />
      <span>{capitalize(item)}</span>
    </label>
  {/each}
</div>

<style>
  div {
    display: inline-flex;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 5px;
    flex-shrink: 1;
  }
  input {
    display: none;
  }
  span {
    display: inline-block;
    flex: 1;
    color: #444;
    user-select: none;
    padding: 0.5rem 0.75rem;
    font-size: 15px;
    border-radius: 5px;
  }
  span:hover {
    background: rgba(0, 0, 0, 0.075);
  }
  :checked + span {
    background: #0060df;
    color: #fff;
  }
</style>
