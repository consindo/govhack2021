<script>
  import { getColor } from './clients/color.js'
  export let itinerary

  const round = (num, factor = 100) =>
    Math.round((num + Number.EPSILON) * factor) / factor

  const timeConvert = (mins) => {
    if (mins < 60) {
      return `${mins} mins`
    } else {
      const hours = Math.floor(mins / 60)
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${mins % 60} mins`
    }
  }

  const getIcon = (description) => {
    let icon = 'bus'
    const desc = description.toLowerCase()
    if (['walk', 'bike', 'ebike', 'drive'].includes(desc)) {
      icon = desc
    } else if (desc.substring(0, 5) === 'train') {
      icon = 'train'
    } else if (desc.substring(0, 5) === 'ferry') {
      icon = 'ferry'
    }
    return `/modes/${icon}.svg`
  }

  $: color = getColor(itinerary.total.description, itinerary.total.index)
  $: subtitle = (itinerary.total.description.split(' (')[1] || '').replace(
    ')',
    ''
  )
  $: trees =
    round(itinerary.total.carbonEmissions / 6, 10) ||
    round(itinerary.total.carbonEmissions / 6, 100)
</script>

<li style="--itinerary-color: {color[0]}; --itinerary-text-color: {color[1]}">
  <div class="description">
    <div class="route-info-wrapper">
      <img
        alt=""
        role="presentation"
        src={getIcon(itinerary.total.description)}
      />
      <div class="route-info">
        <h2>{itinerary.total.description.split(' (')[0]}</h2>
        {#if subtitle !== ''}
          <h4>{subtitle}</h4>
        {/if}
      </div>
    </div>
    <p>
      <strong>{timeConvert(itinerary.total.timeMinutes)}</strong> &middot; {round(
        itinerary.total.distanceKilometers,
        10
      )}<small>km</small>
    </p>
  </div>
  <div class="emissions">
    <h3>{round(itinerary.total.carbonEmissions)}<span>kg</span></h3>
    <h5>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        enable-background="new 0 0 20 20"
        height="18px"
        viewBox="0 0 20 20"
        width="18px"
        fill="#000000"
        ><g><rect fill="none" height="20" width="20" /></g><g
          ><polygon
            points="13,10 15,10 9.97,3 5,10 7,10 4,14 9,14 9,17 11.03,17 11.03,14 16,14"
          /></g
        ></svg
      ><span>{trees} {trees === 1 ? 'tree' : 'trees'}</span>
    </h5>
  </div>
</li>

<style>
  li {
    background: var(--itinerary-color);
    color: var(--itinerary-text-color);
    padding: 1rem;
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(0, 0, 0, 0.25);
  }
  .description {
    flex: 1;
  }
  .route-info-wrapper {
    display: flex;
    align-items: start;
    padding-bottom: 1px;
  }
  .route-info-wrapper img {
    margin-right: 7px;
    margin-left: -2px;
    margin-top: -1px;
    opacity: 0.95;
  }
  .route-info {
    margin-bottom: 0.375rem;
  }
  .emissions {
    text-align: right;
  }
  h2 {
    font-size: 1.1rem;
    margin: 0;
  }
  h4 {
    font-size: 0.75rem;
    margin: 0;
    background: rgba(0, 0, 0, 0.075);
    display: inline-block;
    padding: 1px 3px;
    border-radius: 3px;
    opacity: 0.85;
  }
  h5 {
    font-size: 0.75rem;
    display: inline-flex;
    align-items: center;
    margin: 0;
    opacity: 0.9;
  }
  svg {
    fill: var(--itinerary-text-color);
  }
  h3 {
    font-size: 1.25rem;
    margin: 0.25rem 0 1px;
  }
  h3 span {
    font-weight: normal;
  }
  p {
    margin: 0;
    font-size: 0.9rem;
  }
</style>
