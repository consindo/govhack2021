const apikey = process.env.AT_APIKEY
const endpoint = 'https://api.at.govt.nz'

import { calculateDistance } from './distance.js'
import { calculateCarbon } from './carbonemissions.js'

// at api wants commas to be encoded in some fields but not others
const paramsToQuery = (params) =>
  Object.keys(params)
    .map((i) => `${encodeURIComponent(i)}=${params[i]}`)
    .join('&')

export const plan = async (search) => {
  console.log(search)
  const fromLoc = [search.from.lat, search.from.lon].join(',')
  const toLoc = [search.to.lat, search.to.lon].join(',')
  const query = paramsToQuery({
    from: encodeURIComponent(search.from.address),
    to: encodeURIComponent(search.to.address),
    fromLoc,
    toLoc,
    timeMode: 'A',
    date: encodeURIComponent('2021-08-20T17:26+12:00'),
    modes: 'BUS,TRAIN,FERRY',
    operators: '',
    optimize: 'QUICK',
    maxWalk: 1000,
    maxChanges: -1,
    routes: '',
    showExternalProviders: true,
    'subscription-key': apikey,
  })

  const res = await fetch(`${endpoint}/journeyplanner/v2/plan?${query}`)
  const data = await res.json()
  return data
}

export const roadPlan = async (mode, search) => {
  // hardcoded for now
  const fromLoc = [search.from.lat, search.from.lon].join(',')
  const toLoc = [search.to.lat, search.to.lon].join(',')
  const query = paramsToQuery({
    fromLoc,
    toLoc,
    'subscription-key': apikey,
    mode: mode.toUpperCase(),
  })

  const res = await fetch(`${endpoint}/journeyplanner/v2/roadPlan?${query}`)
  const data = await res.json()
  return data
}

export const geocode = async (searchString) => {
  const query = paramsToQuery({
    limitAlgorithm: '5_per_category',
    query: encodeURIComponent(searchString),
    sortAlgorithm: 'standard',
    'subscription-key': apikey,
  })

  const res = await fetch(
    `${endpoint}/v2/public-restricted/geocode/forward?${query}`
  )
  const data = await res.json()
  return data
}

export const processPlan = (plan) => {
  const itineraryDescriptions = {}
  const itineraries = plan.response.itineraries
    .map((i) => {
      const legs = i.legs.map((j) => {
        let distanceKilometers = 0
        if (j.distanceExact) {
          distanceKilometers = j.distanceExact / 1000
        } else if (j.stops.length > 0) {
          // if the AT API doesn't tell us, we have to calculate
          distanceKilometers = calculateDistance(
            j.stops.map((k) => k.geometry.data)
          )
        } else {
          distanceKilometers = calculateDistance(
            [j.startLat, j.startLon],
            [j.endLat, j.endLon]
          )
        }

        const mode = j.mode.toLowerCase()
        const timeMinutes = j.duration / 60000
        const carbonEmissions = calculateCarbon(
          distanceKilometers,
          timeMinutes,
          mode
        )

        const geojson = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        }
        // create a vector
        if (j.stops.length > 0) {
          geojson.geometry.coordinates = j.stops.map((k) =>
            k.geometry.data
              .slice()
              .reverse()
              .map((i) => parseFloat(i))
          )
        } else {
          geojson.geometry.coordinates = [
            [parseFloat(j.startLon), parseFloat(j.startLat)],
            [parseFloat(j.endLon), parseFloat(j.endLat)],
          ]
        }

        return {
          mode,
          description: j.routeCode || '',
          distanceKilometers,
          timeMinutes,
          carbonEmissions,
          route: geojson,
        }
      })

      const allModes = new Set()
      const allRoutes = new Set()
      let distanceKilometers = 0
      let timeMinutes = 0
      let carbonEmissions = 0
      const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [],
        },
      }
      legs.forEach((l) => {
        allModes.add(l.mode)
        allRoutes.add(l.description)
        distanceKilometers += l.distanceKilometers
        timeMinutes += l.timeMinutes
        carbonEmissions += l.carbonEmissions
        geojson.geometry.coordinates.push(l.route.geometry.coordinates)
      })
      geojson.geometry.coordinates = geojson.geometry.coordinates.flat()
      allModes.delete('walk')
      allRoutes.delete('')
      const description =
        Array.from(allModes)
          .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
          .join(' & ') + ` (${Array.from(allRoutes).join(' + ')})`

      return {
        total: {
          description,
          distanceKilometers,
          timeMinutes,
          carbonEmissions,
          route: geojson,
        },
        legs,
      }
    })
    // deduplicate
    .filter((i) => {
      if (itineraryDescriptions[i.total.description] === undefined) {
        itineraryDescriptions[i.total.description] = true
        return true
      }
      return false
    })

  // only take the top 3 options
  return {
    processed: itineraries.slice(0, 3),
  }
}

export const processRoadPlan = (mode) => {
  return (roadPlan) => {
    const coordinates = roadPlan.response.itineraries[0].PathSegments.map((i) =>
      i.Polyline.split(';').map((j) => j.split(', ').map((k) => parseFloat(k)))
    ).flat()
    const geojson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coordinates.map((i) => i.slice().reverse()),
      },
    }
    const distanceKilometers = calculateDistance(coordinates)
    const timeMinutes = roadPlan.response.itineraries[0].DurationMinutes
    const description = mode.charAt(0).toUpperCase() + mode.slice(1)
    const carbonEmissions = calculateCarbon(
      distanceKilometers,
      timeMinutes,
      mode
    )

    return {
      processed: [
        {
          total: {
            description,
            distanceKilometers,
            timeMinutes,
            carbonEmissions,
            route: geojson,
          },
          legs: [
            {
              mode,
              description: '',
              distanceKilometers,
              timeMinutes,
              carbonEmissions,
              route: geojson,
            },
          ],
        },
      ],
    }
  }
}
