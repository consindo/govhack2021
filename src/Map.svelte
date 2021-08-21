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

    map.on('load', () => {
      map.loadImage('/location-marker.png', (error, image) => {
        if (error) return console.warn('could not load marker')
        map.addImage('location-marker', image)
      })
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
      if (JSON.stringify(bounds) !== JSON.stringify(oldBounds)) {
        map.fitBounds(bounds, { padding: 100 })

        if (oldBounds[0][0] !== 0) {
          map.removeLayer('to-from')
          map.removeSource('to-from')
        }

        map.addSource('to-from', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [mapBounds.from.lon, mapBounds.from.lat],
                },
                properties: {
                  title: mapBounds.from.address.split(',')[0],
                },
              },
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [mapBounds.to.lon, mapBounds.to.lat],
                },
                properties: {
                  title: mapBounds.to.address.split(',')[0],
                },
              },
            ],
          },
        })

        map.addLayer({
          id: 'to-from',
          type: 'symbol',
          source: 'to-from',
          layout: {
            'icon-image': 'location-marker',
            'icon-size': 0.5,
            'icon-offset': [0, -10],
            'text-offset': [0, -7],
            // get the title name from the source's "title" property
            'text-field': ['get', 'title'],
            'text-offset': [0, 1.25],
            'text-anchor': 'top',
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 13,
          },
          paint: {
            'text-halo-color': 'rgba(255,255,255,0.85)',
            'text-halo-width': 2,
          },
        })

        oldBounds = bounds
      }
    }

      // remove all old layers
      const currentItineraries = itineraries.map(i => i.total.description)
      Object.keys(loadedLayers).forEach((i) => {
        if (!currentItineraries.includes(i)){
          map.removeLayer(i)
        map.removeSource(i)
        delete loadedLayers[i]  
        }
      })

    itineraries.forEach((i) => {
      const id = i.total.description
      // deduplicates layers
      if (loadedLayers[id] === undefined && i.total.showLayer === true) {
        loadedLayers[id] = true
      } else {
        return
      }

      const getStacking = () => {
        if (id !== 'Walk' && loadedLayers['Walk'] !== undefined) {
          return 'Walk'
        } else if (id !== 'Bike' && loadedLayers['Bike'] !== undefined) {
          return 'Bike'
        } else if (id !== 'Drive' && loadedLayers['Drive'] !== undefined) {
          return 'Drive'
        }
        return 'to-from'
      }

      if (i.total.route === undefined) return

      map.addSource(id, {
        type: 'geojson',
        data: i.total.route,
      })

      map.addLayer(
        {
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
        },
        getStacking()
      )
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
