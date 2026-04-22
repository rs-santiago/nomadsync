import { IImageService } from '../../application/services/IImageService';
import { getDestinationImage } from '../../services/unsplash';
// Cole aqui aquela sua função getDestinationImage que já existe!

export class UnsplashImageService implements IImageService {
  async getCoverImage(query: string): Promise<string | null> {
    try {
      // Chame a sua função existente do Unsplash aqui
      const url = await getDestinationImage(query);
      return url;      
    } catch (error) {
      return null;
    }
  }
}