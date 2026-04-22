// O contrato para buscar fotos (pode ser Unsplash, Pexels, etc)
export interface IImageService {
  getCoverImage(query: string): Promise<string | null>;
}