const apikey = process.env.AT_APIKEY
const endpoint = 'https://api.at.govt.nz'

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
    date: encodeURIComponent('2021-08-20T20:26+12:00'),
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
