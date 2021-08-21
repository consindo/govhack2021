import emissions from './emissions.json'
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
