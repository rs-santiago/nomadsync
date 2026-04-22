import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Map, Plus, Calendar, Loader2, X, MoreHorizontal, MapPin, Trash2 } from 'lucide-react';

// O formato da viagem que o nosso backend retorna
interface TripOverview {
  id: string;
  title: string;
  imageUrl: string | null;
  startDate: Date | null;
  endDate: Date | null;
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
  const [newTripStartDate, setNewTripStartDate] = useState('');
  const [newTripEndDate, setNewTripEndDate] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);


  useEffect(() => {
    async function loadTrips() {
      try {
        const token = await getToken();
        // Chama a nossa nova rota do backend
        const response = await fetch(`${import.meta.env.VITE_API_URL}/trips`, {
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

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta viagem? Todo o roteiro será apagado.")) return;

    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/destinations/${tripId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Remove a viagem da lista na tela instantaneamente
        setTrips(trips.filter(t => t.id !== tripId));
        setOpenMenuId(null); // Fecha o menu
      }
    } catch (error) {
      console.error("Erro ao deletar viagem:", error);
    }
  };
  // Função para simular a criação de uma nova viagem
  const handleCreateNewTrip = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // Evita recarregar a página se usar o 'Enter'
    if (!newTripTitle.trim()) return; // Não deixa criar viagem sem nome
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/trips`, {
        method: 'POST', // 👈 Chama a rota de criação
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          title: newTripTitle,
          startDate: newTripStartDate || null,
          endDate: newTripEndDate || null
        })
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
            <input
              type="date"
              value={newTripStartDate}
              onChange={(e) => setNewTripStartDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm text-slate-600"
            />
            <input
              type="date"
              value={newTripEndDate}
              onChange={(e) => setNewTripEndDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm text-slate-600"
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
              className="group rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer bg-white flex flex-col w-full md:max-w-sm"
            >
              {/* Capa da Viagem */}
              <div className="h-40 bg-slate-100 relative overflow-hidden">
                {trip.imageUrl ? (
                  <img
                    src={trip.imageUrl}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={trip.title}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                    <MapPin size={32} />
                  </div>
                )}

                {/* Overlay Escuro para destacar a tag */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                {/* Tag de Status Flutuante */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-md text-[10px] font-bold text-slate-700 uppercase tracking-wider shadow-sm">
                  Planejamento
                </div>
              </div>

              {/* Informações */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-slate-800 mb-2">{trip.title}</h3>

                <div className="flex flex-wrap items-center text-slate-500 text-sm gap-x-4 gap-y-2 mb-4">
                  {trip.startDate && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar size={16} className="text-blue-500" />
                      {new Date(trip.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      {trip.endDate && ` - ${new Date(trip.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`}
                    </span>
                  )}
                </div>

                {/* Footer do Card com separador (Empurra pro final do card se ficar alto) */}
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    {/* Você pode trocar isso pelo total real de destinos depois */}
                    Abra para ver o roteiro
                  </div>
                  {/* Container relativo para posicionar o menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Impede de abrir a viagem
                        // Se clicar no mesmo, fecha. Se clicar em outro, abre.
                        setOpenMenuId(openMenuId === trip.id ? null : trip.id); 
                      }}
                      className={`p-1 rounded-md transition-colors ${openMenuId === trip.id ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                      <MoreHorizontal size={20} />
                    </button>

                    {/* O Dropdown Menu */}
                    {openMenuId === trip.id && (
                      <div className="absolute right-0 bottom-full mb-2 w-36 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-10 animate-in fade-in slide-in-from-bottom-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTrip(trip.id);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <Trash2 size={16} />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}