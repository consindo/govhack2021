const apikey = process.env.AT_APIKEY
const endpoint = 'https://api.at.govt.nz'

import { calculateDistance } from './distance.js'
import { calculateCarbon } from './carbonEmissions.js'

// at api wants commas to be encoded in some fields but not others
const paramsToQuery = (params) =>
  Object.keys(params)
    .map((i) => `${encodeURIComponent(i)}=${params[i]}`)
    .join('&')

export const plan = async () => {
  const query = paramsToQuery({
    from: encodeURIComponent('Britomart Transport Center, Auckland Central'),
    to: encodeURIComponent('130 - Panmure Train Station, Panmure'),
    fromLoc: '-36.844034,174.767193',
    toLoc: '-36.89777,174.84967',
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

export const roadPlan = async (mode) => {
  // hardcoded for now
  const query = paramsToQuery({
    fromLoc: '-36.844034,174.767193',
    toLoc: '-36.89777,174.84967',
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
        } else if (j.stops) {
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

        return {
          mode,
          description: j.routeCode || '',
          distanceKilometers,
          timeMinutes,
          carbonEmissions,
        }
      })

      const allModes = new Set()
      const allRoutes = new Set()
      let distanceKilometers = 0
      let timeMinutes = 0
      let carbonEmissions = 0
      legs.forEach((l) => {
        allModes.add(l.mode)
        allRoutes.add(l.description)
        distanceKilometers += l.distanceKilometers
        timeMinutes += l.timeMinutes
        carbonEmissions += l.carbonEmissions
      })
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
        },
        legs,
      }
    })
    .filter((i) => {
      if (itineraryDescriptions[i.total.description] === undefined) {
        itineraryDescriptions[i.total.description] = true
        return true
      }
      return false
    })

  return {
    processed: itineraries,
  }
}

export const processRoadPlan = (mode) => {
  return (roadPlan) => {
    const distanceKilometers = calculateDistance(
      roadPlan.response.itineraries[0].PathSegments.map((i) =>
        i.Polyline.split(';').map((j) =>
          j.split(', ').map((k) => parseFloat(k))
        )
      ).flat()
    )
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
          },
          legs: [
            {
              mode,
              description: '',
              distanceKilometers,
              timeMinutes,
              carbonEmissions,
            },
          ],
        },
      ],
    }
  }
}
