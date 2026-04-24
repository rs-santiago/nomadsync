import { useEffect, useState } from 'react';
import { socket } from './lib/socket';
import { useTripStore } from './store/useTripStore';

import { Header } from './components/Header';
import { AddDestinationForm } from './components/AddDestinationForm';
import { DestinationList } from './components/DestinationList';
import { Loader2 } from 'lucide-react'; // Ícone de carregamento
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
import { TripList } from './components/TripList';
import { TripMap } from './components/TripMap';

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isLoading, setIsLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<{ id: string, name: string, color: string }[]>([]);
  const { getToken, isSignedIn } = useAuth();
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [tripInfo, setTripInfo] = useState<{title: string, startDate: string | null, endDate: string | null} | null>(null);
  const destinations = useTripStore((state) => state.destinations);

  const {
    setInitialData,
    syncRemoteDestination,
    syncRemoveDestination,
    syncRemoteActivity,
    syncRemoveActivity,
    reorderDestinations
  } = useTripStore();

  // 👇 useEffect EXCLUSIVO PARA BUSCAR OS DADOS INICIAIS
  useEffect(() => {
    async function loadTripData() {
      if (!activeTripId) {
        return;
      }
      setIsLoading(true); // Liga o loading AQUI
      await fetchTripData();
    }
    loadTripData();
  }, [activeTripId, getToken, setInitialData]);

  const fetchTripData = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/trips/${activeTripId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const tripData = await response.json();
        setTripInfo({
          title: tripData.title || tripData.name || "Minha Viagem", // Garante um fallback
          startDate: tripData.startDate,
          endDate: tripData.endDate
        });
        // O backend retorna tudo aninhado, então separamos para o formato do nosso Zustand
        const loadedDestinations: any[] = [];
        const loadedActivities: any[] = [];

        // Se tripData.destinations for undefined (viagem nova), usamos um array vazio []
        const destinosSeguros = tripData.destinations || [];

        destinosSeguros.forEach((dest: any) => {
          loadedDestinations.push({ ...dest });

          if (dest.activities) {
            dest.activities.forEach((act: any) => {
              loadedActivities.push({
                id: act.id,
                destinationId: act.destinationId,
                title: act.title,
                type: act.type,
                cost: act.cost
              });
            });
          }
        });

        // Alimenta o Zustand com os dados do banco!
        setInitialData(loadedDestinations, loadedActivities);
      } else {
        const erroDoBackend = await response.json();
        console.error("❌ O BACKEND RECUSOU A ENTREGA:", response.status, erroDoBackend);
      }

    } catch (error) {
      console.error("Erro ao carregar a viagem:", error);
    } finally {
      setIsLoading(false); // Tira o aviso de carregamento da tela
    }
  };

  // useEffect DO SOCKET
  useEffect(() => {
    // Se não tem viagem ativa, garante que o socket está fechado e para por aqui
    if (!activeTripId) {
      socket.disconnect();
      return;
    }

    async function setupSocket() {
      const token = await getToken();
      socket.auth = { token };
      socket.connect(); // 👈 Força a conexão quando entra na viagem
    }

    setupSocket();

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    const handlePresence = (users: any) => setOnlineUsers(users);
    const handleUpdateMap = (data: any) => syncRemoteDestination({ ...data });
    const handleDestRemoved = (data: any) => syncRemoveDestination(data.destinationId);
    const handleActAdded = (data: any) => syncRemoteActivity(data.activity);
    const handleActRemoved = (data: any) => syncRemoveActivity(data.activityId);
    const handleReordered = (data: any) => reorderDestinations(data.startIndex, data.endIndex);

    // 2. LIGAMOS os ouvintes
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('presenceUpdate', handlePresence);
    socket.on('updateTripMap', handleUpdateMap);
    socket.on('destinationRemoved', handleDestRemoved);
    socket.on('activityAdded', handleActAdded);
    socket.on('activityRemoved', handleActRemoved);
    socket.on('destinationsReordered', handleReordered);

    return () => {
      // 3. DESLIGAMOS os ouvintes cirurgicamente quando sair da viagem
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('presenceUpdate', handlePresence);
      socket.off('updateTripMap', handleUpdateMap);
      socket.off('destinationRemoved', handleDestRemoved);
      socket.off('activityAdded', handleActAdded);
      socket.off('activityRemoved', handleActRemoved);
      socket.off('destinationsReordered', handleReordered);
      
      socket.disconnect();
    };
  }, [activeTripId, getToken, syncRemoteDestination, syncRemoveDestination, syncRemoteActivity, syncRemoveActivity, reorderDestinations]);

  // useEffect(() => {
  //   if (isConnected && activeTripId) {
  //     socket.emit('joinTripPlanning', activeTripId);
  //   }
  // }, [activeTripId, isConnected]);

  useEffect(() => {
    const checkInvite = async () => {
      // 1. Olhamos para a URL: nomadsync.app/?invite=ID_DA_VIAGEM
      const params = new URLSearchParams(window.location.search);
      const inviteId = params.get('invite');

      if (inviteId && isSignedIn) {
        try {
          const token = await getToken();
          // 2. Fazemos o Join no Backend
          await fetch(`${import.meta.env.VITE_API_URL}/trips/${inviteId}/join`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          // 3. Define essa viagem como a ativa para abrir o roteiro
          setActiveTripId(inviteId);

          // 4. Limpa a URL para ficar bonitinha de novo (opcional)
          window.history.replaceState({}, '', window.location.origin);
          
        } catch (error) {
          console.error("Erro ao processar convite:", error);
        }
      }
    };

    checkInvite();
  }, [isSignedIn, getToken]);

  // 🪄 LÓGICA DE AUTO-JOIN: Roda assim que o app abre
  useEffect(() => {
    const joinTrip = async () => {
      if (!activeTripId) return;

      try {
        const token = await getToken();

        // Avisa o backend que este usuário quer entrar na viagem
        await fetch(`${import.meta.env.VITE_API_URL}/trips/${activeTripId}/join`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        fetchTripData(); // Puxa os dados atualizados da viagem (incluindo o nome do usuário que entrou)
      } catch (error) {
        console.error("Erro ao processar convite:", error);
      }
    };

    joinTrip();
  }, [activeTripId, getToken]);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto bg-slate-50">
      <SignedOut>
        {/* Tela de Welcome (Mantida igual) */}
        <div className="flex flex-col items-center justify-center h-[60vh] bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Bem-vindo ao NomadSync</h1>
          <p className="text-slate-500 mb-8 text-lg">Planeje suas viagens com amigos em tempo real.</p>
          <SignInButton mode="modal">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
              Começar a Planejar agora
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        {!activeTripId ? (
          <TripList onSelectTrip={setActiveTripId} />
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-500 gap-4">
            <Loader2 className="animate-spin text-blue-600" size={48} />
            <p className="font-medium">Sincronizando roteiro...</p>
          </div>
        ) : (
          <>
            {/* Botão Voltar */}
            <button
              onClick={() => {
                setActiveTripId(null);
                setTripInfo(null);
                socket.disconnect();
                setInitialData([], []);
                // DICA: Remova o ID da URL se estiver usando rotas para limpar o estado
              }}
              className="mb-6 text-slate-500 hover:text-blue-600 font-medium text-sm flex items-center gap-1 transition-colors"
            >
              ← Voltar para Minhas Viagens
            </button>

            {/* O HEADER agora recebe as props de conexão e usuários online.
              O botão de "Convidar" que adicionamos dentro dele vai 
              usar a URL atual para gerar o link automaticamente.
          */}
            <Header 
              isConnected={isConnected}
              onlineUsers={onlineUsers}
              tripId={activeTripId}
              tripName={tripInfo?.title}
              startDate={tripInfo?.startDate}
              endDate={tripInfo?.endDate} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  
              {/* COLUNA ESQUERDA: Formulário e Mapa */}
              <div className="lg:col-span-1 flex flex-col gap-8"> 
                <AddDestinationForm tripId={activeTripId} />
                {/* Passamos os destinos que já buscamos para desenhar os pins */}
                <TripMap destinations={destinations || []} />
              </div>
              
              {/* COLUNA DIREITA: A lista grande de cartões com fotos */}
              <div className="lg:col-span-2">
                <DestinationList tripId={activeTripId} />
              </div>

            </div>
          </>
        )}
      </SignedIn>
    </div>
  );
}

export default App;