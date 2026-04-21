export async function getCoordinates(query: string) {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  
  if (!token) {
    console.error("⚠️ [MAPBOX] Token não encontrado no .env");
    return null;
  }

  try {
    // Fazemos a requisição para a API de Geocoding do Mapbox
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1`
    );

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      // O Mapbox retorna um array 'center' no formato [longitude, latitude]
      const [longitude, latitude] = data.features[0].center;
      
      console.log(`📍 [MAPBOX] Coordenadas de ${query}: [${latitude}, ${longitude}]`);
      
      return { latitude, longitude };
    }

    return null;
  } catch (error) {
    console.error("❌ [MAPBOX] Erro ao buscar coordenadas:", error);
    return null;
  }
}