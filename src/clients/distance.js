const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  var R = 6371 // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1) // deg2rad below
  var dLon = deg2rad(lon2 - lon1)
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  var d = R * c // Distance in km
  return d
}

const deg2rad = (deg) => deg * (Math.PI / 180)

export const calculateDistance = (locationarray) => {
  let totalDistance = 0
  for (let i = 0; i < locationarray.length - 1; i++) {
    const from = locationarray[i]
    const to = locationarray[i + 1]

    const dist = getDistanceFromLatLonInKm(from[0], from[1], to[0], to[1])
    totalDistance += dist
  }
  return totalDistance
}
