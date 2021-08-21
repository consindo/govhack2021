<script>
  import { createEventDispatcher } from 'svelte'
  import { geocode } from './clients/aucklandtransport.js'
  import Loader from './Loader.svelte'

  const dispatch = createEventDispatcher()

  export let searchFromText, searchToText

  let fromInput
  let toInput

  let fromLoading = false
  let toLoading = false

  let fromResults = []
  let toResults = []

  let fromOption = null
  let toOption = null

  $: fromOption === null && timeout === 0 ? (fromOption = searchFromText) : null
  $: toOption === null && timeout === 0 ? (toOption = searchToText) : null
  $: fromInput && timeout === 0
    ? (fromInput.value = (searchFromText || {}).address || '')
    : null
  $: toInput && timeout === 0
    ? (toInput.value = (searchToText || {}).address || '')
    : null

  let timeout = 0
  let currentString = ''
  const search = (point) => (e) => {
    const searchString = e.currentTarget.value
    if (currentString === searchString || searchString.trim() === '') return
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
    const addresses = result.response.addresses.map((i) => ({
      address: i.address.split('\n')[0],
      lat: i.lat,
      lon: i.lng,
    }))
    if (point === 'from') {
      fromResults = addresses
      fromLoading = false
    } else if (point === 'to') {
      toResults = addresses
      toLoading = false
    }
  }

  const select = (point, index) => () => {
    if (point === 'from') {
      let item = fromResults[index]
      fromOption = item
      fromResults = []
      fromInput.value = item.address

      toInput.focus()
    } else if (point === 'to') {
      let item = toResults[index]
      toOption = item
      toResults = []
      toInput.value = item.address
    }
  }

  const confirmOptions = () => {
    if (fromOption == null) {
      fromInput.focus()
      return
    } else if (toOption == null) {
      toInput.focus()
      return
    }

    dispatch('search', {
      from: {
        address: fromOption.address,
        lat: fromOption.lat,
        lon: fromOption.lon,
      },
      to: {
        address: toOption.address,
        lat: toOption.lat,
        lon: toOption.lon,
      },
    })
  }
</script>

<div class="search">
  <div class="container">
    <input
      bind:this={fromInput}
      on:change={search('from')}
      on:keyup={search('from')}
      type="text"
      placeholder="Choose starting point"
    />
    {#if fromResults.length > 0 || fromLoading}
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
    {/if}
  </div>
  <div class="container">
    <input
      bind:this={toInput}
      on:change={search('to')}
      on:keyup={search('to')}
      type="text"
      placeholder="Choose destination"
    />
    {#if toResults.length > 0 || toLoading}
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
    {/if}
  </div>
  <div class="container">
    <button on:click={confirmOptions}>Plan my journey</button>
  </div>
</div>

<style>
  .search .container {
    position: relative;
  }
  .search button {
    width: 100%;
    background: #41ad49;
    color: #fff;
    border: 0;
    border-radius: 5px;
  }
  .search button:hover {
    background: #3c9f43;
  }
  .search button:active {
    background: #34893a;
  }
  .search input {
    width: 100%;
    border-radius: 5px;
  }
  .search .results {
    position: absolute;
    z-index: 1;
    background: #f4f4f4;
    color: #222;
    width: 100%;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15) inset,
      0 1px 10px rgba(0, 0, 0, 0.15);
    font-size: 0.875rem;
    border-radius: 5px;
    overflow: hidden;
  }
  .search .results ul {
    margin: 0;
    padding: 0;
    list-style-type: none;
  }
  .search .results li {
    padding: 0.625rem 0.5rem;
    cursor: default;
    user-select: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
  .search .results li:last-child {
    border-bottom: 0;
  }
  .search .results li:hover {
    background: rgba(0, 0, 0, 0.1);
  }
  .search .results li:active {
    background: rgba(0, 0, 0, 0.2);
  }
</style>
