export const calculateCarbon = (distanceKilometers, timeMinutes, mode) => {
  if (timeMinutes === 0 || distanceKilometers === 0) return 0
  // grabbed from here: https://www.bikeradar.com/features/long-reads/cycling-environmental-impact/
  // need a better source
  const gkmModes = {
    train: 49,
    bus: 101,
    walk: 56,
    cycle: 21,
    drive: 271,
  }
  const gkm = gkmModes[mode]

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
