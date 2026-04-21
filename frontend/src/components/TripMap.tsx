import 'mapbox-gl/dist/mapbox-gl.css';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox';
import { MapPin } from 'lucide-react';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useTripStore } from '../store/useTripStore';

interface TripMapProps {
  destinations: any[];
}

export function TripMap({ destinations }: TripMapProps) {
  const mapRef = useRef<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const focusedId = useTripStore((state) => state.focusedDestinationId);

  // 1. Memoriza os destinos válidos para evitar re-renderizações inúteis
  const validDestinations = useMemo(() =>
    destinations.filter(d => d.latitude && d.longitude),
    [destinations]);

  // 2. Estado da câmera (começa em um ponto neutro se não houver destinos)
  const [viewState, setViewState] = useState({
    longitude: -48.4473,
    latitude: -1.3655,
    zoom: 2
  });

  useEffect(() => {
    if (focusedId && mapRef.current) {
      const target = destinations.find(d => d.id === focusedId);
      
      if (target?.latitude && target?.longitude) {
        mapRef.current.flyTo({
          center: [target.longitude, target.latitude],
          zoom: 14, // Zoom um pouco mais perto para ver detalhes
          duration: 2000,
          essential: true
        });
        
        // Opcional: Já abre o popup automaticamente ao focar
        setSelectedId(target.id);
      }
    }
  }, [focusedId]);

  useEffect(() => {
    if (validDestinations.length > 0 && mapRef.current) {
      const last = validDestinations[validDestinations.length - 1];

      // Pequeno delay para garantir que o Mapbox processou o estilo
      const timer = setTimeout(() => {
        mapRef.current.flyTo({
          center: [last.longitude, last.latitude],
          zoom: 12,
          duration: 2500,
          essential: true
        });
      }, 500); // 500ms é o tempo ideal para o primeiro carregamento

      return () => clearTimeout(timer);
    }
  }, [validDestinations.length]);

  return (
    <div className="w-full h-[400px] md:h-[600px] rounded-2xl overflow-hidden shadow-sm border border-slate-100 sticky top-8 bg-slate-900">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        reuseMaps // Melhora a performance
        onLoad={() => {
          if (validDestinations.length > 0) {
            const last = validDestinations[validDestinations.length - 1];
            mapRef.current?.flyTo({
              center: [last.longitude, last.latitude],
              zoom: 10,
              duration: 1000 // Um voo mais rápido no início
            });
          }
        }}
      >
        <NavigationControl position="top-right" />

        {/* 📍 Pins */}
        {validDestinations.map((dest) => (
          <Marker
            key={dest.id}
            longitude={dest.longitude}
            latitude={dest.latitude}
            anchor="bottom"
          >
            <div
              onClick={(e) => {
                e.stopPropagation(); // Evita bugar o mapa ao clicar no pino
                setSelectedId(dest.id);
              }}
              className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] hover:text-white transition-all cursor-pointer hover:scale-125"
            >
              <MapPin fill="currentColor" size={32} />
            </div>
          </Marker>
        ))}

        {/* 💬 Popup */}
        {selectedId && (
          <Popup
            longitude={validDestinations.find(d => d.id === selectedId)?.longitude}
            latitude={validDestinations.find(d => d.id === selectedId)?.latitude}
            anchor="top"
            onClose={() => setSelectedId(null)}
            closeOnClick={false}
            className="z-50"
          >
            <div className="flex flex-col gap-2 p-1 max-w-[200px] text-slate-800">
              {validDestinations.find(d => d.id === selectedId)?.imageUrl && (
                <img
                  src={validDestinations.find(d => d.id === selectedId)?.imageUrl}
                  className="w-full h-24 object-cover rounded-lg"
                  alt="Preview"
                />
              )}
              <div className="flex flex-col">
                <span className="font-bold text-sm">
                  {validDestinations.find(d => d.id === selectedId)?.name}
                </span>
                <span className="text-[10px] text-slate-500 italic">Destino confirmado</span>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}