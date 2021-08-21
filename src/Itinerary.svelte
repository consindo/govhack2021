<script>
  import { getColor } from './clients/color.js'
  export let itinerary

  const round = (num) => Math.round((num + Number.EPSILON) * 100) / 100

  const timeConvert = (mins) => {
    if (mins < 60) {
      return `${mins} mins`
    } else {
      const hours = Math.floor(mins / 60)
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${mins % 60} mins`
    }
  }

  $: color = getColor(itinerary.total.description, itinerary.total.index)
  $: subtitle = (itinerary.total.description.split(' (')[1] || '').replace(')', '')
</script>

<li style="--itinerary-color: {color[0]}; --itinerary-text-color: {color[1]}">
  <div class="description">
    <div class="route-info">
      <h2>{itinerary.total.description.split(' (')[0]}</h2>
      {#if subtitle !== ''}
        <h4>{subtitle}</h4>
      {/if}
    </div>
    <p><strong>{timeConvert(itinerary.total.timeMinutes)}</strong> &middot; {round(itinerary.total.distanceKilometers)}<small>km</small>
    </p>
  </div>
  <h3 class="emissions">
    {round(itinerary.total.carbonEmissions)}<span>kg</span>
  </h3>
</li>

<style>
  li {
    background: var(--itinerary-color);
    color: var(--itinerary-text-color);
    padding: 1rem;
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(0, 0, 0, .25);
  }
  .description {
    flex: 1;
  }
  .route-info {
    margin-bottom: 0.375rem;
  }
  h2 {
    font-size: 1.1rem;
    margin: 0;
  }
  h4 {
    font-size: 0.75rem;
    margin: 0;
    background: rgba(0,0,0,0.075);
    display: inline-block;
    padding: 1px 3px;
    border-radius: 3px;
    opacity: 0.85;
  }
  h3 {
    font-size: 1.25rem;
    margin: 0;
  }
  h3 span {
    font-weight: normal;
  }
  p {
    margin: 0;
    font-size: .9rem;
  }
</style>
