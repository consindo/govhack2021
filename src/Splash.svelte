<script>
  import { createEventDispatcher } from 'svelte'
  import Search from './Search.svelte'

  const dispatch = createEventDispatcher()

  let visible = true

  const forwardAndHide = (event) => {
    visible = false
    dispatch('search', event.detail)
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
