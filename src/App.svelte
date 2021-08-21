<script>
  import { plan, roadPlan, processPlan, processRoadPlan } from './clients/aucklandtransport.js'
  import Search from './Search.svelte'
  import Loader from './Loader.svelte'

  $: itineraries = []
  let loading = false

  const itcb = data => {
    loading = false
    console.log(data)
    const newItineraries = itineraries
    data.processed.forEach(i => newItineraries.push(i))
    itineraries = newItineraries
  }

  const round = num => Math.round((num + Number.EPSILON) * 100) / 100

  const handleSearch = (event) => {
    loading = true
    itineraries = []
    plan(event.detail).then(processPlan).then(itcb)
    roadPlan('cycle', event.detail).then(processRoadPlan('cycle')).then(itcb)
    roadPlan('walk', event.detail).then(processRoadPlan('walk')).then(itcb)
    roadPlan('drive', event.detail).then(processRoadPlan('drive')).then(itcb)
  }

</script>

<main>
  <h1>govhack2021</h1>
  <div class="sidebar">
    <Search on:search={handleSearch} />
    {#if loading}
      <Loader />
    {/if}
    {#each itineraries as itinerary}
      <h2>{itinerary.total.description}</h2>
      <p><strong>Minutes:</strong> {itinerary.total.timeMinutes}</p>
      <p><strong>Distance:</strong> {round(itinerary.total.distanceKilometers)}km</p>
      <p><strong>Carbon Emissions:</strong> {round(itinerary.total.carbonEmissions)}kg</p>
    {/each}
  </div>

</main>

<style>
  main {
    padding: 1em;
    margin: 0 auto;
  }

  .sidebar {
    width: 320px;
  }

  h1 {
    color: #ff3e00;
    font-size: 4em;
    font-weight: 100;
  }

  pre {
    font-family: 'Consolas', 'monospace';
    max-height: 350px;
    color: #fff;
    background: #222;
    overflow: scroll;
  }
</style>
