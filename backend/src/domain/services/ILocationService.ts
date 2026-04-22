
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ILocationService {
  getCoordinates(address: string): Promise<Coordinates | null>;
}