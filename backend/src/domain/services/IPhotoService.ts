export interface IPhotoService {
  getPhotoUrl(query: string): Promise<string | null>;
}