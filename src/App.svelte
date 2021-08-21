<script>
  import {
    plan,
    roadPlan,
    processPlan,
    processRoadPlan,
  } from './clients/aucklandtransport.js'
  import Search from './Search.svelte'
  import Loader from './Loader.svelte'
  import Itinerary from './Itinerary.svelte'
  import MapView from './Map.svelte'

  $: mapBounds = {}
  let loading = false

  let ptData = null
  let cycleData = null
  let walkData = null
  let driveData = null

  const handleSearch = async (event) => {
    loading = true
    
    cycleData = null
    walkData = null
    driveData = null
    mapBounds = event.detail

    // this will then work async to get all the data into the right place
    await Promise.any([
      roadPlan('cycle', event.detail).then((data) => (cycleData = data)),
      roadPlan('walk', event.detail).then((data) => (walkData = data)),
      roadPlan('drive', event.detail).then((data) => (driveData = data)),
    ])
    loading = false
  }

  let travelTime = 'peak'
  let travelTimes = ['peak', 'off-peak']

  // this is reactive when the travelTime changes
  const loadPt = async (mapBounds, travelTime) => {
    if (Object.keys(mapBounds).length > 0) {
      ptData = null
      loading = true
      await plan(mapBounds, { travelTime }).then((data) => (ptData = data))  
      loading = false
    }
  }
  $: loadPt(mapBounds, travelTime)

  let carSize = 'Small'
  let carSizes = ['Small', 'Medium', 'Large']

  let carType = 'regular petrol'
  let carTypes = [
    'regular petrol',
    'premium petrol',
    'diesel',
    'hybrid',
    'plug-in hybrid electric',
    'electric',
  ]

  $: itineraries = [
    processPlan(ptData),
    processRoadPlan(cycleData, 'Bike', { travelTime, emissionOptions: ['Bike', 'Pedal']}),
    processRoadPlan(cycleData, 'eBike', { travelTime, emissionOptions: ['Bike', 'eBike']}),
    processRoadPlan(walkData, 'Walk', { travelTime, emissionOptions: ['Foot']}),
    processRoadPlan(driveData, 'Drive', { travelTime, emissionOptions: [
      'Car',
      carSize,
      carType,
      '1 passenger',
      'co2_per_km',
    ]}),
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
      <h4>Travel Time</h4>
      {#each travelTimes as time}
          <label>
            <input
              type="radio"
              bind:group={travelTime}
              name="travelTime"
              value={time}
            />
            {time.charAt(0).toUpperCase() + time.slice(1)}
          </label>
        {/each}

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
    <ul>
      {#each itineraries as itinerary}
        <Itinerary {itinerary} />
      {/each}
    </ul>
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
    box-shadow: 1px 0 0 rgba(0,0,0,0.2);
    overflow-y: auto;
    z-index: 2;
  }

  .results {
    width: 350px;
    box-sizing: border-box;
    box-shadow: 1px 0 0 rgba(0,0,0,0.2);
    background: #f4f4f4;
    overflow-y: auto;
    z-index: 1;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style-type: none;
  }

  .map {
    flex: 1;
  }
</style>
