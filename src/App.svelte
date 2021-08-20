<script>
  import { plan, roadPlan, processPlan, processRoadPlan } from './clients/aucklandtransport.js'
  import Search from './Search.svelte'

  $: itineraries = []

  const cb = data => {
    console.log(data)
    const newItineraries = itineraries
    data.processed.forEach(i => newItineraries.push(i))
    itineraries = newItineraries
  }
  plan().then(processPlan).then(cb)
  roadPlan('cycle').then(processRoadPlan('cycle')).then(cb)
  roadPlan('walk').then(processRoadPlan('walk')).then(cb)
  roadPlan('drive').then(processRoadPlan('drive')).then(cb)

  const round = num => Math.round((num + Number.EPSILON) * 100) / 100

</script>

<main>
  <h1>govhack2021</h1>
  <Search />
  {#if itineraries.length === 0}
    Loading from Auckland Transport...
  {/if}
  {#each itineraries as itinerary}
    <h2>{itinerary.total.description}</h2>
    <p><strong>Minutes:</strong> {itinerary.total.timeMinutes}</p>
    <p><strong>Distance:</strong> {round(itinerary.total.distanceKilometers)}km</p>
    <p><strong>Carbon Emissions:</strong> {round(itinerary.total.carbonEmissions)}kg</p>
  {/each}


</main>

<style>
  main {
    padding: 1em;
    margin: 0 auto;
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
