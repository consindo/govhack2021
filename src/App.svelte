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
  let queryCollapsed = true

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
  <div class={queryCollapsed ? 'query collapsed' : 'query'}>
    <div class="brand">
      <img class="brand-img" src="/icon.png" alt="logo" />
      <h1>Net Zero Waka</h1>
      <button class="close" on:click={() => (queryCollapsed = true)}
        ><img alt="Close" src="/close_white_24dp.svg" /></button
      >
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
  <div
    class={queryCollapsed
      ? 'map-results-wrapper'
      : 'map-results-wrapper opacity'}
  >
    <div class="results">
      {#if itineraries.length > 0}
        <div class="sort-wrapper">
          <h3>Trips</h3>
          <div class="sort-button" on:click={changeSortType}>
            <span>Sorted by {sortType}</span><img
              role="presentation"
              alt=""
              src="/south_white_18dp.svg"
            />
          </div>
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
      <button on:click={() => (queryCollapsed = false)}
        >Trip Options<img
          alt=""
          role="presentation"
          src="/expand_less_black_24dp.svg"
        /></button
      >
      <MapView {itineraries} {mapBounds} />
    </div>
  </div>
</main>

<style>
  main {
    margin: 0 auto;
    display: flex;
    height: 100%;
    height: -webkit-fill-available;
  }

  .map-results-wrapper {
    display: flex;
    flex: 1;
    height: 100%;
  }

  .brand {
    background: #2d3039;
    color: #fff;
    padding: 1rem;
    display: flex;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .brand .brand-img {
    width: 2rem;
    height: 2rem;
    margin-right: 0.625rem;
  }

  .brand .close {
    flex: 1;
    padding: 0;
    background: transparent;
    border: 0;
    margin: 0;
    text-align: right;
    opacity: 0.8;
    display: none;
  }
  .brand .close:hover {
    opacity: 1;
  }
  .brand .close:active {
    opacity: 0.6;
  }
  .brand .close img {
    vertical-align: top;
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

  .query h3 {
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

  @media (max-width: 1000px) {
    .brand {
      padding: 0.5rem;
    }
    .brand .brand-img {
      width: 1.5rem;
      height: 1.5rem;
      margin-right: 0.375rem;
    }
    .brand .close {
      display: block;
    }

    h1 {
      font-size: 1rem;
    }
    h2 {
      font-size: 1.1rem;
    }
    .query h3 {
      padding: 0.625rem 1rem 0.5rem;
    }
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
    background: #24262f;
    color: #fff;
    align-items: center;
    user-select: none;
    line-height: 16px;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .sort-wrapper h3 {
    flex: 1;
    margin: 0;
    font-size: 0.9rem;
    background: none;
  }
  .sort-wrapper span {
    font-size: 0.75rem;
  }
  .sort-wrapper img {
    margin-left: 3px;
    vertical-align: top;
  }
  .sort-button {
    cursor: pointer;
  }
  .sort-button:hover {
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

  .map button {
    position: absolute;
    top: 0.5rem;
    background: rgba(255, 255, 255, 0.85);
    font-weight: bold;
    border: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    z-index: 5;
    font-size: 0.9rem;
    padding: 0.5rem 0.625rem;
    border-radius: 4px;
    letter-spacing: -0.25px;
    text-shadow: 0 1px 0 #fff;
    display: none;
    line-height: 20px;
  }
  .map button:hover {
    background: #fff;
  }
  .map button:active {
    opacity: 0.7;
  }
  .map button img {
    vertical-align: top;
    margin-top: -1px;
    margin-right: -8px;
    transform: rotate(90deg);
  }

  @media (max-width: 1000px) {
    main {
      display: block;
      position: relative;
    }
    .query {
      position: absolute;
      top: 0;
      bottom: 0;
      right: 0;
      box-shadow: -1px 0 0 rgba(0, 0, 0, 0.2);
      z-index: 10;
      transition: 300ms ease transform;
    }
    .map button {
      right: 0.5rem;
      display: inline-block;
    }

    .query.collapsed {
      transform: translate3d(301px, 0, 0);
    }
  }
  @media (max-width: 649px) {
    .map-results-wrapper {
      flex-direction: column-reverse;
      transition: 300ms ease opacity;
    }
    .map-results-wrapper.opacity {
      opacity: 0.25;
    }
    .results {
      height: 60%;
      width: 100%;
      box-shadow: 0 0 1px rgba(0, 0, 0, 0.2) inset;
    }
    .query {
      left: 0;
      right: auto;
      box-shadow: 1px 0 0 rgba(0, 0, 0, 0.2);
    }
    .query.collapsed {
      transform: translate3d(-301px, 0, 0);
    }
    .map button {
      left: 0.5rem;
      right: auto;
    }
  }
</style>
