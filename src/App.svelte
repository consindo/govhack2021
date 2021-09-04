<script>
  import {
    plan,
    roadPlan,
    processPlan,
    processRoadPlan,
  } from './clients/aucklandtransport.js'
  import Splash from './Splash.svelte'
  import Search from './Search.svelte'
  import Loader from './Loader.svelte'
  import Itinerary from './Itinerary.svelte'
  import MapView from './Map.svelte'
  import RadioGroup from './RadioGroup.svelte'
  import RadioButton from './RadioButton.svelte'

  $: mapBounds = {}
  let loading = false

  let ptData = null
  let cycleData = null
  let walkData = null
  let driveData = null

  let searchFromText = null
  let searchToText = null

  const handleSearch = async (event) => {
    loading = true

    cycleData = null
    walkData = null
    driveData = null
    mapBounds = event.detail

    searchFromText = event.detail.from
    searchToText = event.detail.to

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

  let sortType = 'emissions'
  const changeSortType = () => {
    if (sortType === 'emissions') {
      sortType = 'time'
    } else {
      sortType = 'emissions'
    }
  }

  let diet = 'medium'
  let diets = ['low', 'medium', 'high']

  let walkSpeed = 5
  let walkSpeeds = [5, 7, 9]

  let bikeSpeed = 15
  let bikeSpeeds = [15, 22, 28]

  let ebikeSpeed = 22
  let ebikeSpeeds = [22, 28, 33]

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

  let activeVisible = false
  let ptVisible = false
  let carVisible = false
  let creditsVisible = false

  $: itineraries = [
    processPlan(ptData, {
      emissionOptions: {
        walk: ['Foot', diet],
        bus: ['Bus', busPower, travelTime],
        train: ['Rail', trainPower],
        ferry: ['Ferry', 'Passenger ferry'],
      },
    }),
    processRoadPlan(cycleData, 'Bike', {
      travelTime,
      speed: bikeSpeed,
      emissionOptions: ['Bike', 'Pedal', diet],
    }),
    processRoadPlan(cycleData, 'eBike', {
      travelTime,
      speed: ebikeSpeed,
      emissionOptions: ['Bike', 'eBike', diet],
    }),
    processRoadPlan(walkData, 'Walk', {
      travelTime,
      speed: walkSpeed,
      emissionOptions: ['Foot', diet],
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
      if (sortType === 'emissions') {
        return a.total.carbonEmissions - b.total.carbonEmissions
      } else if (sortType === 'time') {
        return a.total.timeMinutes - b.total.timeMinutes
      }
    })
</script>

<Splash on:search={handleSearch} />
<main>
  <div class="query">
    <div class="brand">
      <img src="/icon.png" alt="logo" />
      <h1>Net Zero Waka</h1>
    </div>
    <div class="section-wrapper search-wrapper">
      <h2>Plan a journey</h2>
      <Search on:search={handleSearch} {searchFromText} {searchToText} />
    </div>
    <div>
      <div class="section-wrapper">
        <h2>Travel Options</h2>
        <p>
          Everyone is different, and not all travel modes will work for
          everybody. Use the options to find the best trips for you!
        </p>
        <h4>Travel Time</h4>
        <RadioGroup collection={travelTimes} bind:group={travelTime} />
        <p>
          Choosing to travel outside of peak hours will result in faster trips,
          reduced costs, and lower emissions.
        </p>
      </div>

      <h3 on:click={() => (activeVisible = !activeVisible)}>
        <span>Walking &amp; Cycling</span>
        <img
          alt="expand / collapse"
          src="/expand_less_black_24dp.svg"
          style={!activeVisible ? 'transform: rotate(180deg)' : ''}
        />
      </h3>
      {#if activeVisible}
        <div class="section-wrapper">
          <p>
            Walking &amp; cycling are great options for shorter trips. You’ll
            lower your carbon emissions by eating better, traveling faster, and
            you’ll become more healthy too!
          </p>
          <h4>Diet Emissions</h4>
          <RadioButton collection={diets} bind:group={diet} />
          <p>
            Your walking & cycling emissions are heavily dependent on what you
            eat. Eating less red meat & more local produce can signficantly
            reduce your carbon impact.
          </p>

          <h4>Walking Speed</h4>
          <RadioButton collection={walkSpeeds} bind:group={walkSpeed} />

          <h4>Biking Speed</h4>
          <RadioButton collection={bikeSpeeds} bind:group={bikeSpeed} />

          <h4>eBike Speed</h4>
          <RadioButton collection={ebikeSpeeds} bind:group={ebikeSpeed} />
        </div>
      {/if}

      <h3 on:click={() => (ptVisible = !ptVisible)}>
        <span>Public Transport</span>
        <img
          alt="expand / collapse"
          src="/expand_less_black_24dp.svg"
          style={!ptVisible ? 'transform: rotate(180deg)' : ''}
        />
      </h3>
      {#if ptVisible}
        <div class="section-wrapper">
          <p>
            Public transport can be the most convenient option, but it will
            depend on the route. Buses in Tāmaki Makaurau are also being
            replaced with electric options!
          </p>
          <div class="radio-group-wrapper">
            <h4>Buses</h4>
            <RadioGroup collection={busPowers} bind:group={busPower} />
          </div>

          <div class="radio-group-wrapper">
            <h4>Trains</h4>
            <RadioGroup collection={trainPowers} bind:group={trainPower} />
          </div>
        </div>
      {/if}

      <h3 on:click={() => (carVisible = !carVisible)}>
        <span>Car</span>
        <img
          alt="expand / collapse"
          src="/expand_less_black_24dp.svg"
          style={!carVisible ? 'transform: rotate(180deg)' : ''}
        />
      </h3>
      {#if carVisible}
        <div class="section-wrapper">
          <p>
            While every car will get stuck in traffic, more fuel efficient cars
            will release less carbon dioxide into the atmosphere.
          </p>
          <h4>Size</h4>
          <RadioGroup collection={carSizes} bind:group={carSize} />

          <h4>Fuel Type</h4>
          <RadioButton collection={carTypes} bind:group={carType} />

          {#if carType === 'electric'}
            <h4>Charge Type</h4>
            <RadioButton collection={evPowers} bind:group={evPower} />
          {/if}

          <h4>Passengers</h4>
          <RadioButton collection={carPassengers} bind:group={carPassenger} />
        </div>
      {/if}
      <h3 on:click={() => (creditsVisible = !creditsVisible)}>
        <span>Info &amp; Credits</span>
        <img
          alt="expand / collapse"
          src="/expand_less_black_24dp.svg"
          style={!creditsVisible ? 'transform: rotate(180deg)' : ''}
        />
      </h3>
      {#if creditsVisible}
        <div class="section-wrapper">
          <p>
            We built Net Zero Waka to help you make travel choices. We wouldn't
            have been able to create this without leaning on a number of
            different data sources.
          </p>
          <p>This app is open source—contributions are welcome!</p>
          <p>
            <a href="https://github.com/consindo/govhack2021"
              >github.com/consindo/govhack2021</a
            >
          </p>
          <h4>Data Sources</h4>
          <ul class="credits-list">
            <li>
              <a href="https://at.govt.nz">Auckland Transport</a> Routing & Directions
            </li>
            <li>
              <a
                href="https://www.mbie.govt.nz/building-and-energy/energy-and-natural-resources/energy-statistics-and-modelling/energy-statistics/new-zealand-energy-sector-greenhouse-gas-emissions/"
                >MBIE</a
              > NZ Emissions
            </li>
            <li>
              <a href="https://ourworldindata.org/travel-carbon-footprint"
                >Our World in Data</a
              >
              Core CO<sub>2</sub> emission calculations
            </li>
            <li>
              <a href="https://rightcar.govt.nz">Rightcar</a> Vehicle Emissions
            </li>
            <li>
              <a
                href="https://genless.govt.nz/assets/Everyone-Resources/electric-vehicle-running-cost-calculations.xlsx"
                >Gen Less</a
              > EV Running Costs
            </li>
            <li>
              <a href="https://www.mapbox.com/">Mapbox & OpenStreetMap</a> Base Map
            </li>
          </ul>
        </div>
      {/if}
    </div>
  </div>
  <div class="results">
    {#if itineraries.length > 0}
      <div class="sort-wrapper" on:click={changeSortType}>
        <img role="presentation" alt="" src="/south_white_18dp.svg" />
        <span>Sorted by {sortType}</span>
      </div>
    {/if}
    {#if loading}
      <Loader />
    {/if}
    {#if itineraries.length === 0 && !loading}
      <p class="not-found">
        No routes found - choose somewhere nearby, and try again!
      </p>
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

  .brand {
    background: #2d3039;
    color: #fff;
    padding: 1rem;
    display: flex;
    align-items: center;
  }

  .brand img {
    width: 2rem;
    height: 2rem;
    margin-right: 0.625rem;
  }

  h1 {
    font-size: 1.125rem;
    margin: 0;
    flex: 1;
  }

  .query {
    width: 300px;
    box-sizing: border-box;
    padding: 0;
    box-shadow: 1px 0 0 rgba(0, 0, 0, 0.2);
    overflow-y: auto;
    z-index: 2;
    background: #fafafa;
  }

  .section-wrapper {
    padding: 0.5rem 1rem;
    background: #fff;
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  }

  .search-wrapper {
    background: #f4f4f4;
    padding-bottom: 1rem;
  }

  .results {
    width: 350px;
    box-sizing: border-box;
    box-shadow: 1px 0 0 rgba(0, 0, 0, 0.2);
    background: #f4f4f4;
    overflow-y: auto;
    z-index: 1;
  }

  h2 {
    font-size: 1.25rem;
    margin: 1rem 0 0.75rem;
  }

  h3 {
    font-size: 1.125rem;
    padding: 0.75rem 1rem;
    margin: 0;
    background: #f4f4f4;
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
    user-select: none;
    display: flex;
  }

  h3:hover {
    background: #eee;
  }
  h3:active {
    background: #ddd;
  }

  h3 span {
    flex: 1;
  }

  h4 {
    font-size: 1rem;
    margin: 1rem 0 0.5rem;
  }

  p {
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }

  .not-found {
    text-align: center;
    margin: 2rem;
  }

  .radio-group-wrapper {
    padding: 0.25rem 0 0.5rem;
    display: flex;
    align-items: center;
  }
  .radio-group-wrapper h4 {
    margin: 0;
    flex: 1;
  }

  .credits-list {
    font-size: 13px;
    list-style-type: disc;
    padding-left: 0.5em;
  }
  .credits-list li {
    margin-bottom: 0.5em;
  }
  .credits-list a {
    display: block;
  }

  .sort-wrapper {
    display: flex;
    padding: 0.375rem 0.5rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
    font-weight: bold;
    font-size: 0.825rem;
    background: #24262f;
    color: #fff;
    align-items: center;
    user-select: none;
    cursor: pointer;
  }
  .sort-wrapper span {
    flex: 1;
  }
  .sort-wrapper img {
    margin-right: 3px;
  }
  .sort-wrapper:hover {
    text-decoration: underline;
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
