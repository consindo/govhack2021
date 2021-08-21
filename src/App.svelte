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

  let walkSpeed = 5
  let walkSpeeds = [5,7,9]

  let bikeSpeed = 15
  let bikeSpeeds = [15,22,28]

  let ebikeSpeed = 22
  let ebikeSpeeds = [22,28,33]

  let busPower = 'Diesel'
  let busPowers = ['Diesel', 'Electric']

  let trainPower = 'Electric'
  let trainPowers = ['Diesel', 'Electric']

  let carSize = 'Medium'
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

  let evPower = 'EV home charge average rate'
  let evPowers = [
    'EV home charge off peak',
    'EV home charge average rate',
    'EV public charge',
  ]

  let carPassenger = '1 passenger'
  let carPassengers = [
    '1 passenger',
    '2 passenger',
    '3 passenger',
    '4 passenger',
    '5 passenger',
  ]

  $: itineraries = [
    processPlan(ptData, {
      emissionOptions: {
        walk: ['Foot'],
        bus: ['Bus', busPower],
        train: ['Rail', trainPower],
        ferry: ['Ferry', 'Passenger ferry'],
      }
    }),
    processRoadPlan(cycleData, 'Bike', {
      travelTime,
      speed: bikeSpeed,
      emissionOptions: ['Bike', 'Pedal'],
    }),
    processRoadPlan(cycleData, 'eBike', {
      travelTime,
      speed: ebikeSpeed,
      emissionOptions: ['Bike', 'eBike'],
    }),
    processRoadPlan(walkData, 'Walk', {
      travelTime,
      speed: walkSpeed,
      emissionOptions: ['Foot'],
    }),
    processRoadPlan(driveData, 'Drive', {
      travelTime,
      emissionOptions: [
        'Car',
        carSize,
        carType,
        carType === 'electric' ? [evPower, carPassenger] : carPassenger,
        'co2_per_km',
      ].flat(),
    }),
  ]
    .filter((i) => i !== null)
    .map((i) => {
      return i.processed
    })
    .flat()
    .sort((a, b) => {
      return a.total.carbonEmissions - b.total.carbonEmissions
    })

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)

  const speedify = (speed, index) => `${['Normal', 'Quick', 'Fast'][index]} (${speed}km/h)`
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
          {capitalize(time)}
        </label>
      {/each}

      <h3>Walking &amp; Cycling</h3>
      <h4>Walking Speed</h4>
      {#each walkSpeeds as speed, i}
        <label>
          <input
            type="radio"
            bind:group={walkSpeed}
            name="walkSpeed"
            value={speed}
          />
          {speedify(speed, i)}
        </label>
      {/each}

      <h4>Biking Speed</h4>
      {#each bikeSpeeds as speed, i}
        <label>
          <input
            type="radio"
            bind:group={bikeSpeed}
            name="bikeSpeed"
            value={speed}
          />
          {speedify(speed, i)}
        </label>
      {/each}

      <h4>eBike Speed</h4>
      {#each ebikeSpeeds as speed, i}
        <label>
          <input
            type="radio"
            bind:group={ebikeSpeed}
            name="ebikeSpeed"
            value={speed}
          />
          {speedify(speed, i)}
        </label>
      {/each}


      <h3>Public Transport</h3>
      <h4>Buses</h4>
      {#each busPowers as power}
        <label>
          <input
            type="radio"
            bind:group={busPower}
            name="busPower"
            value={power}
          />
          {capitalize(power)}
        </label>
      {/each}
      <h4>Trains</h4>
      {#each trainPowers as power}
        <label>
          <input
            type="radio"
            bind:group={trainPower}
            name="trainPower"
            value={power}
          />
          {capitalize(power)}
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
          {capitalize(size)}
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
          {capitalize(type)}
        </label>
      {/each}

      {#if carType === 'electric'}
        <h4>Charge Type</h4>
        {#each evPowers as power}
          <label>
            <input
              type="radio"
              bind:group={evPower}
              name="evPower"
              value={power}
            />
            {capitalize(power.replace('EV ', ''))}
          </label>
        {/each}
      {/if}

      <h4>Passengers</h4>
      {#each carPassengers as passenger}
        <label>
          <input
            type="radio"
            bind:group={carPassenger}
            name="carPassenger"
            value={passenger}
          />
          {passenger}
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
    box-shadow: 1px 0 0 rgba(0, 0, 0, 0.2);
    overflow-y: auto;
    z-index: 2;
  }

  .results {
    width: 350px;
    box-sizing: border-box;
    box-shadow: 1px 0 0 rgba(0, 0, 0, 0.2);
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
