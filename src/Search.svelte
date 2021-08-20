<script>
  import { geocode } from './clients/aucklandtransport.js'
  import Loader from './Loader.svelte'

  let fromInput
  let toInput

  let fromLoading = false
  let toLoading = false

  let fromResults = []
  let toResults = []

  let timeout = 0
  let currentString = ''
  const search = (point) => (e) => {
    const searchString = e.currentTarget.value
    if (currentString === searchString) return
    currentString = searchString
    clearTimeout(timeout)
    timeout = setTimeout(executeSearch(point, searchString), 750)
  }

  const executeSearch = (point, value) => async () => {
    if (point === 'from') {
      fromLoading = true
    } else if (point === 'to') {
      toLoading = true
    }

    const result = await geocode(value)
    if (point === 'from') {
      fromResults = result.response.addresses
      fromLoading = false
    } else if (point === 'to') {
      toResults = result.response.addresses
      toLoading = false
    }
  }

  const select = (point, index) => () => {
    let resultsArray = fromResults
    if (point === 'to') {
      resultsArray = toResults
    }

    const item = resultsArray[index]
    console.log(item)

    fromResults = []
    toResults = []

    if (point === 'from') {
      fromInput.value = item.address
      toInput.focus()
    } else if (point === 'to') {
      toInput.value = item.address
    }
  }
</script>

<div class="search">
  <div class="container">
    <input bind:this={fromInput} on:change={search('from')} on:keyup={search('from')} type="text"
    placeholder="Choose starting point">
    <div class="results">
      {#if fromLoading}
      <Loader />
      {/if}
      <ul>
        {#each fromResults as result, i}
        <li on:click={select('from', i)}>{result.address}</li>
        {/each}
      </ul>
    </div>
  </div>
  <div class="container">
    <input bind:this={toInput} on:change={search('to')} on:keyup={search('to')} type="text"
    placeholder="Choose destination">
    <div class="results">
      {#if toLoading}
      <Loader />
      {/if}
      <ul>
        {#each toResults as result, i}
        <li on:click={select('to', i)}>{result.address}</li>
        {/each}
      </ul>
    </div>
  </div>
</div>

<style>
  .search .container {
    position: relative;
    width: 300px;
  }
  .search input {
    width: 100%;
  }
  .search .results {
    position: absolute;
    z-index: 1;
    background: #eee;
    width: 100%;
  }
  .search .results ul {
    margin: 0;
    padding: 0;
    list-style-type: none;
  }
  .search .results li {
    padding: 0.5rem;
    cursor: default;
    user-select: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
  .search .results li:hover {
    background: rgba(0, 0, 0, 0.15);
  }
  .search .results li:active {
    background: rgba(0, 0, 0, 0.25);
  }
</style>
