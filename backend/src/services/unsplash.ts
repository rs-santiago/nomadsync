import { createApi } from 'unsplash-js';

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
});

export async function getDestinationImage(query: string) {
    console.log(`\n🔍 [UNSPLASH] Buscando imagem para: "${query}"`);
    console.log(`🔑 [UNSPLASH] Chave detectada? ${!!process.env.UNSPLASH_ACCESS_KEY}`);
  try {
    const result = await unsplash.search.getPhotos({
      query: query,
      perPage: 1,
      orientation: 'landscape',
    });

    // Se o Unsplash retornar um erro oficial (ex: Chave inválida)
    if (result.errors) {
      console.error("❌ [UNSPLASH] Erro da API:", result.errors[0]);
      return null; 
    }

    // Se a foto for encontrada com sucesso
    if (result.response && result.response.results.length > 0) {
      const imageUrl = result.response.results[0].urls.regular;
      console.log("✅ [UNSPLASH] Foto encontrada com sucesso!");
      return imageUrl;
    }

    console.log("⚠️ [UNSPLASH] Busca não encontrou nenhuma foto.");
    // Fallback caso não encontre imagem
    return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=1000';
  } catch (error) {
    console.error("Erro Unsplash:", error);
    return null;
  }
}