export interface Coordinate {
  lat: number;
  lng: number;
}

export interface CountryData {
  name: string;
  coords: Coordinate;
}

export interface Connection {
  from: Coordinate;
  to: Coordinate;
  targetName: string;
}