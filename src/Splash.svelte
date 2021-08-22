<script>
  import { createEventDispatcher } from 'svelte'
  import Search from './Search.svelte'

  const dispatch = createEventDispatcher()

  let visible = true

  const forwardAndHide = (event) => {
    visible = false
    dispatch('search', event.detail)
  }

  const preselectedTrip = (trip) => () => {
    const trips = [
      {
        from: {
          address: '125 - Henderson Train Station, Henderson',
          lat: -36.88096,
          lon: 174.63091,
        },
        to: {
          address: 'Commercial Bay, Auckland Central',
          lat: -36.84374,
          lon: 174.7664,
        },
      },
      {
        from: {
          address: 'Newmarket, Newmarket',
          lat: -36.870641,
          lon: 174.776993,
        },
        to: {
          address: '2006 - Stop A Domestic Terminal, Auckland Airport',
          lat: -37.00638,
          lon: 174.79063,
        },
      },
      {
        from: {
          address: '133 - Britomart Train Station, Auckland Central',
          lat: -36.84429,
          lon: 174.76847,
        },
        to: {
          address: '9670 - Devonport Ferry Terminal, Devonport',
          lat: -36.83317,
          lon: 174.7954,
        },
      },
    ]
    visible = false
    dispatch('search', trips[trip])
  }
</script>

<main
  style="--splash-opacity: {visible ? '1' : '0'}; --splash-events: {visible
    ? 'auto'
    : 'none'};"
>
  <div class="wrapper">
    <div class="brand">
      <img src="/icon.png" alt="logo" />
      <h1>Net Zero Waka</h1>
    </div>
    <p>
      Discover your trip options, and their impact on the climate in Tāmaki
      Makaurau, Auckland
    </p>
    <div class="search-wrapper">
      <Search on:search={forwardAndHide} />
    </div>
    <div class="pre-selected">
      <p>or try out a sample trip</p>
      <ul>
        <li on:click={preselectedTrip(0)}>Henderson to Downtown</li>
        <li on:click={preselectedTrip(1)}>Newmarket to Airport</li>
        <li on:click={preselectedTrip(2)}>Britomart to Devonport</li>
      </ul>
    </div>
  </div>
  <div class="attribution">
    Photo by <a
      href="https://unsplash.com/@jannevele?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
      >Nguyen</a
    >
    on
    <a
      href="https://unsplash.com/s/photos/auckland?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
      >Unsplash</a
    >
  </div>
</main>

<style>
  main {
    opacity: var(--splash-opacity);
    pointer-events: var(--splash-events);
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    padding: 2rem 1rem;
    transition: 300ms ease all;
    text-align: center;
    background-image: url(/splash.jpg);
    background-color: rgb(237, 243, 243);
    background-size: cover;
    background-position: 50% 0%;
    overflow: hidden;
  }

  img {
    width: 60px;
    height: 60px;
  }

  h1 {
    font-size: 1.5rem;
  }

  .wrapper {
    margin: 0 auto;
    max-width: 350px;
  }

  .search-wrapper {
    padding: 0.75rem 0.75rem 0.25rem;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.07);
    backdrop-filter: blur(5px);
    text-align: left;
  }

  .pre-selected {
    margin-top: 2rem;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
  }

  .pre-selected p {
    font-size: 14px;
    color: #444;
    margin: 0 0 0.5rem;
  }
  .pre-selected ul {
    margin: 0;
    padding: 0;
    list-style-type: none;
    display: flex;
  }
  .pre-selected li {
    user-select: none;
    width: 33%;
    font-size: 14px;
    margin: 0.125rem;
    padding: 0.25rem;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(0, 0, 0, 0.07);
    border-radius: 5px;
  }
  .pre-selected li:hover {
    background: rgba(255, 255, 255, 0.7);
  }
  .pre-selected li:active {
    background: rgba(255, 255, 255, 0.9);
  }

  .attribution {
    font-size: 12px;
    padding: 2px 5px;
    background: rgba(255, 255, 255, 0.5);
    position: absolute;
    bottom: 5px;
    right: 5px;
    border-radius: 3px;
  }
  .attribution a {
    color: #555;
  }
</style>
