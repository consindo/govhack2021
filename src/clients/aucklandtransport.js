const apikey = process.env.AT_APIKEY
const endpoint = 'https://api.at.govt.nz'

import polyline from '@mapbox/polyline'
import { calculateDistance } from './distance.js'
import { calculateCarbon, calculateFuel } from './carbonemissions.js'

// at api wants commas to be encoded in some fields but not others
const paramsToQuery = (params) =>
  Object.keys(params)
    .map((i) => `${encodeURIComponent(i)}=${params[i]}`)
    .join('&')

const requestCache = {}

export const plan = async (search, options) => {
  // urgh this logic to get a date is probably wrong, but who cares
  let date = new Date()
  date.setHours(23)
  date.setMinutes(59)
  if (date.getDay() === 6) {
    date.setDate(date.getDate() + 2)
  } else if (date.getDay() === 0) {
    date.setDate(date.getDate() + 1)
  }
  const dateString = date.toISOString().split('T')[0]

  let time = '12:00'
  if (options.travelTime === 'peak') {
    // determine whether it is morning or afternoon peak
    // based on if they're going to the city or not
    const britomartLat = -36.844235
    const britomartLon = 174.768128

    const fromDelta = Math.abs(
      search.from.lat - britomartLat + search.from.lon - britomartLon
    )
    const toDelta = Math.abs(
      search.to.lat - britomartLat + search.to.lon - britomartLon
    )
    if (fromDelta > toDelta) {
      // going to the city, so morning
      time = '08:15'
    } else {
      // going away from the city, so afternoon
      time = '17:15'
    }
  }

  const fromLoc = [search.from.lat, search.from.lon].join(',')
  const toLoc = [search.to.lat, search.to.lon].join(',')
  const query = paramsToQuery({
    from: encodeURIComponent(search.from.address),
    to: encodeURIComponent(search.to.address),
    fromLoc,
    toLoc,
    timeMode: 'A',
    date: encodeURIComponent(`${dateString}T${time}+12:00`),
    modes: 'BUS,TRAIN,FERRY',
    operators: '',
    optimize: 'QUICK',
    maxWalk: 1000,
    maxChanges: -1,
    routes: '',
    showExternalProviders: true,
    'subscription-key': apikey,
  })

  const cacheKey = `plan-${options.travelTime}`
  const url = `${endpoint}/journeyplanner/v2/plan?${query}`
  // creates a new cache
  if (requestCache[cacheKey] === undefined) {
    requestCache[cacheKey] = { url: '', data: {} }
  }

  if (requestCache[cacheKey].url !== url) {
    const res = await fetch(url)
    const data = await res.json()
    requestCache[cacheKey] = { url, data }
    return data
  } else {
    return requestCache[cacheKey].data
  }
}

export const roadPlan = async (mode, search) => {
  // hardcoded for now
  const fromLoc = [search.from.lat, search.from.lon].join(',')
  const toLoc = [search.to.lat, search.to.lon].join(',')

  const queryParams = {
    fromLoc,
    toLoc,
    'subscription-key': apikey,
    mode: mode.toUpperCase(),
  }
  if (mode === 'walk') {
    queryParams.travelSpeed = 5
  }
  const query = paramsToQuery(queryParams)

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

export const processPlan = (plan, options) => {
  if (plan === null) return null
  if (plan === 'Error returned from journey planner service') return null
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
        if (isNaN(distanceKilometers)) distanceKilometers = 0

        const mode = j.mode.toLowerCase()
        const timeMinutes = j.duration / 60000

        const carbonEmissions = calculateCarbon(
          distanceKilometers,
          timeMinutes,
          options.emissionOptions[mode]
        )

        const geojson = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        }
        if (j.legGeometry && j.legGeometry.type === 'Polyline') {
          geojson.geometry = polyline.toGeoJSON(j.legGeometry.points)
        } else if (j.stops.length > 0) {
          // create a vector between each stop
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
        properties: {
          title: '',
        },
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
      const secondaryDescription = Array.from(allRoutes).join(' + ')
      const description = `${Array.from(allModes)
        .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
        .join(' & ')} (${secondaryDescription})`
      geojson.properties.title = secondaryDescription

      return {
        total: {
          description,
          distanceKilometers,
          timeMinutes,
          carbonEmissions,
          cost: i.fareHopAdult,
          index: 0,
          showLayer: true,
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
    // add an index
    .map((i, index) => {
      i.total.index = index
      return i
    })

  // only take the top 3 options
  return {
    processed: itineraries.slice(0, 3),
  }
}

export const processRoadPlan = (roadPlan, mode, options) => {
  if (roadPlan === null) return null
  if (roadPlan.response.itineraries.length === 0) return null
  const description = mode
  mode = mode.toLowerCase()

  const coordinates = roadPlan.response.itineraries[0].PathSegments.map((i) =>
    i.Polyline.split(';').map((j) => j.split(', ').map((k) => parseFloat(k)))
  ).flat()
  const geojson = {
    type: 'Feature',
    properties: {
      title: description,
    },
    geometry: {
      type: 'LineString',
      coordinates: coordinates.map((i) => i.slice().reverse()),
    },
  }
  const distanceKilometers = calculateDistance(coordinates)
  let timeMinutes = roadPlan.response.itineraries[0].DurationMinutes

  // base walk is 5km/h and bike is 15km/h
  let cost = 0
  const speed = options.speed
  if (mode === 'walk') {
    timeMinutes = Math.round((timeMinutes * 5) / speed)
  } else if (mode === 'bike' || mode === 'ebike') {
    timeMinutes = Math.round((timeMinutes * 15) / speed)
  } else if (mode === 'drive') {
    if (options.travelTime === 'peak') {
      timeMinutes = Math.round(timeMinutes * 1.5)
    }
    cost = calculateFuel(
      distanceKilometers,
      timeMinutes,
      options.emissionOptions
    )
  }
  const carbonEmissions = calculateCarbon(
    distanceKilometers,
    timeMinutes,
    options.emissionOptions
  )

  return {
    processed: [
      {
        total: {
          description,
          distanceKilometers,
          timeMinutes,
          carbonEmissions,
          cost,
          index: 0,
          showLayer: mode !== 'ebike',
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
