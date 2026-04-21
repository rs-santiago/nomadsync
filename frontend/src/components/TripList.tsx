import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Map, Plus, Calendar, ArrowRight, Loader2, X } from 'lucide-react';

// O formato da viagem que o nosso backend retorna
interface TripOverview {
  id: string;
  title: string;
  createdAt: string;
}

interface TripListProps {
  onSelectTrip: (tripId: string) => void;
}

export function TripList({ onSelectTrip }: TripListProps) {
  const { getToken } = useAuth();
  const [trips, setTrips] = useState<TripOverview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTripTitle, setNewTripTitle] = useState('');

  useEffect(() => {
    async function loadTrips() {
      try {
        const token = await getToken();
        // Chama a nossa nova rota do backend
        const response = await fetch('http://localhost:3333/trips', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache', // Evita cache para sempre pegar os dados mais recentes
            'Pragma': 'no-cache'
          },
          cache: 'no-store' // Outra camada para garantir que o navegador não cacheie a resposta
        });
        
        if (response.ok) {
          const data = await response.json();
          setTrips(data);
        }
      } catch (error) {
        console.error("Erro ao buscar viagens:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadTrips();
  }, [getToken]);

  // Função para simular a criação de uma nova viagem
  const handleCreateNewTrip = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // Evita recarregar a página se usar o 'Enter'
    if (!newTripTitle.trim()) return; // Não deixa criar viagem sem nome
    try {
      const token = await getToken();
      const response = await fetch('http://localhost:3333/trips', {
        method: 'POST', // 👈 Chama a rota de criação
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newTripTitle })
      });
      
      if (response.ok) {
        const novaViagem = await response.json();
        onSelectTrip(novaViagem.id); // 👈 Redireciona para o ID REAL gerado pelo banco!
      }
    } catch (error) {
      console.error("Erro ao criar viagem:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p>Carregando seu painel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Minhas Viagens</h2>
          <p className="text-slate-500">Selecione um roteiro ou crie um novo</p>
        </div>
        {/* 👇 O EFEITO DE TOGGLE: Mostra o form OU o botão */}
        {!isCreating ? (
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Nova Viagem
          </button>
        ) : (
          <form onSubmit={handleCreateNewTrip} className="flex items-center gap-2">
            <input 
              type="text"
              autoFocus
              placeholder="Ex: Férias no Japão"
              value={newTripTitle}
              onChange={(e) => setNewTripTitle(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 min-w-[250px]"
            />
            <button 
              type="submit"
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-slate-800 transition-colors"
            >
              Criar
            </button>
            <button 
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewTripTitle(''); // Limpa se o usuário cancelar
              }}
              className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </form>
        )}
      </div>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-500 gap-4">
          <Map size={48} className="text-slate-300" />
          <p>Você ainda não tem nenhuma viagem planejada.</p>
          <button onClick={handleCreateNewTrip} className="text-blue-600 font-medium hover:underline">
            Criar meu primeiro roteiro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div 
              key={trip.id}
              onClick={() => onSelectTrip(trip.id)}
              className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group flex flex-col justify-between h-48"
            >
              <div>
                <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                  <Map size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{trip.title}</h3>
              </div>
              
              <div className="flex items-center justify-between text-slate-400 text-sm border-t border-slate-50 pt-4 mt-4">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>{new Date(trip.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-600" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}