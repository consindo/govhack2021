<script>
  import { plan, roadPlan, processPlan, processRoadPlan } from './clients/aucklandtransport.js'
  import Search from './Search.svelte'
  import Loader from './Loader.svelte'
  import MapView from './Map.svelte'

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
  <div class="query">
    <h2>Search</h2>
    <Search on:search={handleSearch} />
  </div>
  <div class="results">
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
  <div class="map">
    <MapView />
  </div>
</main>

<style>
  main {
    margin: 0 auto;
    display: flex;
    height: 100%;
  }

  .query {
    width: 300px;
    box-sizing: border-box;
    padding: 1rem;
    border-right: 1px solid #ccc;
    overflow-y: auto;
  }

  .results {
    width: 350px;
    box-sizing: border-box;
    padding: 1rem;
    border-right: 1px solid #ccc;
    overflow-y: auto;
  }

  .map {
    flex: 1;
  }
</style>
