<script>
  import { onMount, afterUpdate } from 'svelte'
  import { getColor } from './clients/color.js'

  export let itineraries, mapBounds

  const token = process.env.MAPBOX_TOKEN
  mapboxgl.accessToken = token

  let map = null

  onMount(async () => {
    map = new mapboxgl.Map({
      container: 'map-content',
      zoom: 12,
      style: 'mapbox://styles/mapbox/light-v10',
      center: [174.769286, -36.843537],
    })
  })

  let oldBounds = [
    [0, 0],
    [0, 0],
  ]
  let loadedLayers = {}

  afterUpdate(() => {
    if (mapBounds.from && mapBounds.to) {
      const bounds = [
        [mapBounds.from.lon, mapBounds.from.lat],
        [mapBounds.to.lon, mapBounds.to.lat],
      ]
      if (JSON.stringify(bounds) !== oldBounds) {
        map.fitBounds(bounds, { padding: 100 })
        oldBounds = bounds
      }
    }

    if (itineraries.length === 0) {
      Object.keys(loadedLayers).forEach((i) => {
        map.removeLayer(i)
        map.removeSource(i)
      })
      loadedLayers = {}
    }

    itineraries.forEach((i) => {
      const id = i.total.description
      // deduplicates layers
      if (loadedLayers[id] === undefined && i.total.showLayer === true) {
        loadedLayers[id] = true
      } else {
        return
      }

      if (i.total.route === undefined) return

      map.addSource(id, {
        type: 'geojson',
        data: i.total.route,
      })

      map.addLayer({
        id,
        type: 'line',
        source: id,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': getColor(id, i.total.index)[0],
          'line-width': 5,
        },
      })
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
