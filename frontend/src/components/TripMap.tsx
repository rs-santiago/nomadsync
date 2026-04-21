import 'mapbox-gl/dist/mapbox-gl.css';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox';
import { MapPin } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

interface TripMapProps {
  destinations: any[];
}

export function TripMap({ destinations }: TripMapProps) {
  // 👇 OS ESTADOS DEVEM FICAR AQUI DENTRO 👇
  const [viewState, setViewState] = useState({
    longitude: -48.4473,
    latitude: -1.3655,
    zoom: 3
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<any>(null);

  // Efeito para centralizar no primeiro destino quando a lista carregar
  useEffect(() => {
    // Pega o último destino adicionado que tenha coordenadas
    const lastDest = [...destinations].reverse().find(d => d.latitude && d.longitude);

    if (lastDest && mapRef.current) {
      // ✈️ O efeito "FlyTo" faz o mapa deslizar suavemente até o destino
      mapRef.current.flyTo({
        center: [lastDest.longitude, lastDest.latitude],
        zoom: 12,
        duration: 2000, // 2 segundos de viagem
        essential: true
      });
    }
  }, [destinations.length]);

  return (
    <div className="w-full h-[400px] md:h-[600px] rounded-2xl overflow-hidden shadow-sm border border-slate-100 sticky top-8">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
      >
        <NavigationControl position="top-right" />

        {/* 📍 Pins */}
        {destinations.map((dest) => {
          if (!dest.longitude || !dest.latitude) return null;

          return (
            <Marker
              key={dest.id}
              longitude={dest.longitude}
              latitude={dest.latitude}
              anchor="bottom"
            >
              <div
                onClick={() => setSelectedId(dest.id)} // 👈 Abre o popup ao clicar
                className="text-blue-500 drop-shadow-md hover:text-blue-400 transition-colors cursor-pointer"
              >
                <MapPin fill="currentColor" size={32} />
              </div>
            </Marker>
          );
        })}

        {/* 💬 Popup (Balão de informação) */}
        {selectedId && (
          <Popup
            longitude={destinations.find(d => d.id === selectedId)?.longitude}
            latitude={destinations.find(d => d.id === selectedId)?.latitude}
            anchor="top"
            onClose={() => setSelectedId(null)}
            closeOnClick={false}
            className="z-50"
          >
            <div className="flex flex-col gap-2 p-1 max-w-[200px]">
              {destinations.find(d => d.id === selectedId)?.imageUrl && (
                <img
                  src={destinations.find(d => d.id === selectedId)?.imageUrl}
                  className="w-full h-24 object-cover rounded-lg"
                  alt="Preview"
                />
              )}
              <div className="flex flex-col">
                <span className="font-bold text-slate-800 text-sm">
                  {destinations.find(d => d.id === selectedId)?.name}
                </span>
                <span className="text-xs text-slate-500">Destino da sua viagem</span>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}