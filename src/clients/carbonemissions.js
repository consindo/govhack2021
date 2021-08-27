import emissions from './emissions.json'

const fuel = {
  electric: {
    'EV home charge off peak': 0.15,
    'EV home charge average rate': 0.29,
    'EV public charge': 0.63,
  },
  'premium petrol': 2.6,
  'regular petrol': 2.3,
  hybrid: 2.3, // also uses regular petrol
  'plug-in hybrid electric': 4.6, // also uses regular petrol, but numbers are a bit cooked so double
  diesel: 1.55,
}

export const calculateCarbon = (
  distanceKilometers,
  timeMinutes,
  emissionOptions
) => {
  if (timeMinutes === 0 || distanceKilometers === 0) return 0

  const gkm = emissionOptions.reduce((accumulator, currentValue) => {
    return accumulator[currentValue]
  }, emissions)

  const speed = (distanceKilometers / timeMinutes) * 60
  const speedFactor =
    0.0004 * Math.pow(speed / 10, 4) -
    0.0147 * Math.pow(speed / 10, 3) +
    0.2046 * Math.pow(speed / 10, 2) -
    (1.2246 * speed) / 10 +
    3.6361
  const carbon = distanceKilometers * gkm * speedFactor
  return Math.round(carbon / 10) / 100
}

export const calculateFuel = (
  distanceKilometers,
  timeMinutes,
  emissionOptions
) => {
  if (timeMinutes === 0 || distanceKilometers === 0) return 0

  const efficiency = emissionOptions.reduce((accumulator, currentValue) => {
    if (currentValue === 'co2_per_km') {
      currentValue = Object.keys(accumulator).filter(
        (i) => i !== 'co2_per_km'
      )[0]
    }
    return accumulator[currentValue]
  }, emissions)

  const fuelCost = emissionOptions
    .slice(2, -2)
    .reduce((accumulator, currentValue) => {
      return accumulator[currentValue]
    }, fuel)

  const cost = Math.round(efficiency * distanceKilometers * fuelCost)
  return cost
}
