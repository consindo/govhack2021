<script>
  export let collection, group

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)
  const speedify = (speed, index) => `${['Normal', 'Quick', 'Fast'][index]} (${speed}km/h)`

  const name = (Math.random()).toString()
</script>

<div>
{#each collection as item, index}
  <label>
    <input
      type="radio"
      bind:group={group}
      name={name}
      value={item}
    />
    <span>{isFinite(item) ? speedify(item, index) : capitalize(item.replace('EV ', ''))}</span>
  </label>
{/each}
</div>

<style>
  label {
    user-select: none;
  }
</style>
