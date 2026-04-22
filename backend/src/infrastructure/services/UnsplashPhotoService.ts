import { IPhotoService } from '../../domain/services/IPhotoService';
import { createApi } from 'unsplash-js';

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
});

export class UnsplashPhotoService implements IPhotoService {
  async getPhotoUrl(query: string): Promise<string | null> {
    try {
        const result = await unsplash.search.getPhotos({
        query: query,
        perPage: 1,
        orientation: 'landscape',
        });

        // Se o Unsplash retornar um erro oficial (ex: Chave inválida)
        if (result.errors) {
        return null; 
        }

        // Se a foto for encontrada com sucesso
        if (result.response?.results?.length > 0) {
        // Colocamos o ?. para garantir que o TS fique tranquilo
        const imageUrl = result.response.results[0]?.urls?.regular;
        
        if (imageUrl) {
            return imageUrl;
        }
        }

        // Fallback caso não encontre imagem
        return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=1000';
    } catch (error) {
        console.error("Erro Unsplash:", error);
        return null;
    }
  }
}