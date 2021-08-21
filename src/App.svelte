<script>
  import {
    plan,
    roadPlan,
    processPlan,
    processRoadPlan,
  } from './clients/aucklandtransport.js'
  import Search from './Search.svelte'
  import Loader from './Loader.svelte'
  import MapView from './Map.svelte'

  $: mapBounds = {}
  let loading = false

  let ptData = null
  let cycleData = null
  let walkData = null
  let driveData = null

  const round = (num) => Math.round((num + Number.EPSILON) * 100) / 100

  const handleSearch = async (event) => {
    loading = true
    ptData = null
    cycleData = null
    walkData = null
    driveData = null
    mapBounds = event.detail

    // this will then work async to get all the data into the right place
    await Promise.any([
      plan(event.detail).then((data) => (ptData = data)),
      roadPlan('cycle', event.detail).then((data) => (cycleData = data)),
      roadPlan('walk', event.detail).then((data) => (walkData = data)),
      roadPlan('drive', event.detail).then((data) => (driveData = data)),
    ])
    loading = false
  }

  let carSize = 'Small'
  let carSizes = ['Small', 'Medium', 'Large']

  let carType = 'petrol'
  let carTypes = [
    'petrol',
    'diesel',
    'hybrid',
    'plug-in hybrid electric',
    'electric',
  ]

  $: itineraries = [
    processPlan(ptData),
    processRoadPlan(cycleData, 'cycle', ['Bike', 'Pedal']),
    processRoadPlan(walkData, 'walk', ['Foot']),
    processRoadPlan(driveData, 'drive', [
      'Car',
      carSize,
      carType,
      '1 passenger',
      'offpeak',
    ]),
  ]
    .filter((i) => i !== null)
    .map((i) => {
      return i.processed
    })
    .flat()
    .sort((a, b) => {
      return a.total.carbonEmissions - b.total.carbonEmissions
    })
</script>

<main>
  <div class="query">
    <h2>Search</h2>
    <Search on:search={handleSearch} />
    <div>
      <h3>Car</h3>
      <h4>Size</h4>
      {#each carSizes as size}
        <label>
          <input
            type="radio"
            bind:group={carSize}
            name="carSize"
            value={size}
          />
          {size.charAt(0).toUpperCase() + size.slice(1)}
        </label>
      {/each}

      <h4>Type</h4>
      {#each carTypes as type}
        <label>
          <input
            type="radio"
            bind:group={carType}
            name="carType"
            value={type}
          />
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </label>
      {/each}
    </div>
  </div>
  <div class="results">
    {#if loading}
      <Loader />
    {/if}
    {#each itineraries as itinerary}
      <h2>{itinerary.total.description}</h2>
      <p><strong>Minutes:</strong> {itinerary.total.timeMinutes}</p>
      <p>
        <strong>Distance:</strong>
        {round(itinerary.total.distanceKilometers)}km
      </p>
      <p>
        <strong>Carbon Emissions:</strong>
        {round(itinerary.total.carbonEmissions)}kg
      </p>
    {/each}
  </div>
  <div class="map">
    <MapView {itineraries} {mapBounds} />
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
