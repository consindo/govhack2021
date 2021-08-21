<script>
  import { onMount, afterUpdate } from 'svelte'

  const token = process.env.MAPBOX_TOKEN
  mapboxgl.accessToken = token

  let map = null

  onMount(async () => {
    map = new mapboxgl.Map({
      container: 'map-content',
      zoom: 12,
      style: 'mapbox://styles/consindo/ckjtsal580mwi19o1qyebauwv',
      center: [174.769286, -36.843537],
    })
  })
</script>

<div id="map-content" />

<style>
  #map-content {
    width: 100%;
    height: 100%;
  }
</style>
