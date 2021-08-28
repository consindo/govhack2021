<script>
  import { onMount, afterUpdate } from 'svelte'
  import { getColor } from './clients/color.js'

  export let itineraries, mapBounds

  const iconScale = window.devicePixelRatio > 1 ? 0.5 : 1
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
      ;[
        '/location-marker-1x.png',
        '/modes/bike-mask-1x.png',
        '/modes/drive-mask-1x.png',
        '/modes/walk-mask-1x.png',
      ].forEach((file) => {
        if (window.devicePixelRatio > 1) {
          file = file.replace('-1x', '-2x')
        }
        map.loadImage(file, (error, image) => {
          if (error) return console.warn('could not load', filename, error)
          const name = file
            .split('/')
            .slice(-1)[0]
            .replace(/-\dx\.png/, '')
          map.addImage(name, image)
        })
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
            'icon-size': iconScale,
            'icon-offset': [0, -10],
            'text-offset': [0, -7],
            // get the title name from the source's "title" property
            'text-field': ['get', 'title'],
            'text-offset': [0, 1.25],
            'text-anchor': 'top',
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 12,
          },
          paint: {
            'text-halo-color': 'rgba(255,255,255,0.85)',
            'text-halo-width': 1.5,
          },
        })

        oldBounds = bounds
      }
    }

    // remove all old layers
    const currentItineraries = itineraries.map((i) => i.total.description)
    Object.keys(loadedLayers).forEach((i) => {
      if (!currentItineraries.includes(i)) {
        map.removeLayer(`${i}-line`)
        map.removeLayer(`${i}-symbol`)
        map.removeSource(i)
        delete loadedLayers[i]
      }
    })

    itineraries.forEach((i) => {
      const id = i.total.description
      // deduplicates layers
      if (loadedLayers[id] === undefined && i.total.showLayer === true) {
        console.log(loadedLayers)
        loadedLayers[id] = true
      } else {
        return
      }

      const getStacking = (type) => {
        if (id !== 'Walk' && loadedLayers['Walk'] !== undefined) {
          return `Walk-${type}`
        } else if (id !== 'Bike' && loadedLayers['Bike'] !== undefined) {
          return `Bike-${type}`
        } else if (id !== 'Drive' && loadedLayers['Drive'] !== undefined) {
          return `Drive-${type}`
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
          id: `${id}-line`,
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
        getStacking('line')
      )

      const iconStyles = {
        'icon-image': `${id.toLowerCase()}-mask`,
        'icon-size': iconScale,
        'symbol-placement': 'line',
        'icon-keep-upright': true,
        'icon-rotation-alignment': 'viewport',
      }
      const textStyles = {
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-field': '{title}', // part 2 of this is how to do it
        'text-size': 13,
        'symbol-placement': 'line',
      }

      map.addLayer(
        {
          id: `${id}-symbol`,
          type: 'symbol',
          source: id,
          layout: ['Walk', 'Bike', 'Drive'].includes(id)
            ? iconStyles
            : textStyles,
          paint: {
            'text-halo-color': 'rgba(255,255,255,0.85)',
            'text-halo-width': 2,
          },
        },
        getStacking('symbol')
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
