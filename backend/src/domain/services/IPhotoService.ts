// backend/src/domain/services/IPhotoService.ts
export interface IPhotoService {
  getPhotoUrl(query: string): Promise<string | null>;
}