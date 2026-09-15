export interface GeoCoordinate {
  readonly latitude: number;
  readonly longitude: number;
}

const EARTH_MEAN_RADIUS_METERS = 6_371_008.8;

function assertCoordinate(coordinate: GeoCoordinate): void {
  const { latitude, longitude } = coordinate;
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new RangeError('latitude must be a finite number between -90 and 90');
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new RangeError('longitude must be a finite number between -180 and 180');
  }
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

/**
 * Great-circle distance using the haversine formula and mean Earth radius.
 * Suitable for nearby-station ranking, not cadastral/survey calculations.
 */
export function greatCircleDistanceMeters(from: GeoCoordinate, to: GeoCoordinate): number {
  assertCoordinate(from);
  assertCoordinate(to);

  const latitude1 = degreesToRadians(from.latitude);
  const latitude2 = degreesToRadians(to.latitude);
  const latitudeDelta = latitude2 - latitude1;
  const longitudeDelta = degreesToRadians(to.longitude - from.longitude);

  const sinLatitude = Math.sin(latitudeDelta / 2);
  const sinLongitude = Math.sin(longitudeDelta / 2);
  const haversine =
    sinLatitude * sinLatitude +
    Math.cos(latitude1) * Math.cos(latitude2) * sinLongitude * sinLongitude;
  const centralAngle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return EARTH_MEAN_RADIUS_METERS * centralAngle;
}
