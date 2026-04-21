import { useEffect, useState } from 'react';
import { socket } from './lib/socket';
import { useTripStore } from './store/useTripStore';
import type { Destination, Activity } from './store/useTripStore';

import { Header } from './components/Header';
import { AddDestinationForm } from './components/AddDestinationForm';
import { DestinationList } from './components/DestinationList';
import { Loader2 } from 'lucide-react'; // Ícone de carregamento
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
import { TripList } from './components/TripList';

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isLoading, setIsLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<{id: string, name: string, color: string}[]>([]);
  const { getToken } = useAuth();
  const [activeTripId, setActiveTripId] = useState<string | null>(null);

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
        console.log("🛑 Cancelou o fetch porque o activeTripId é nulo (Estamos no Dashboard).");
        return; 
      }       
      setIsLoading(true); // Liga o loading AQUI

      try {
        const token = await getToken();
        const response = await fetch(`http://localhost:3333/trips/${activeTripId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const tripData = await response.json();
          console.log("📦 DADOS QUE CHEGARAM DO BANCO:", tripData);
          // O backend retorna tudo aninhado, então separamos para o formato do nosso Zustand
          const loadedDestinations: any[] = [];
          const loadedActivities: any[] = [];

          // 👇 TRAVA DE SEGURANÇA: Se tripData.destinations for undefined (viagem nova), usamos um array vazio []
          const destinosSeguros = tripData.destinations || [];

          destinosSeguros.forEach((dest: any) => {
            loadedDestinations.push({ id: dest.id, name: dest.name });

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
    }
    loadTripData();
  }, [activeTripId, getToken, setInitialData]);

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
      socket.emit('joinTripPlanning', activeTripId);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    // Liga os ouvintes
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('presenceUpdate', setOnlineUsers);
    socket.on('updateTripMap', (data) => syncRemoteDestination({ id: data.destinationId, name: data.destination }));
    socket.on('destinationRemoved', (data) => syncRemoveDestination(data.destinationId));
    socket.on('activityAdded', (data) => syncRemoteActivity(data.activity));
    socket.on('activityRemoved', (data) => syncRemoveActivity(data.activityId));
    socket.on('destinationsReordered', (data) => reorderDestinations(data.startIndex, data.endIndex));

    return () => {
      // Limpa tudo quando sai da viagem
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('presenceUpdate');
      socket.off('updateTripMap');
      socket.off('destinationRemoved');
      socket.off('activityAdded');
      socket.off('activityRemoved');
      socket.off('destinationsReordered');
      socket.disconnect();
    };
  }, [activeTripId, getToken, syncRemoteDestination, syncRemoveDestination, syncRemoteActivity, syncRemoveActivity, reorderDestinations]);

  useEffect(() => {
    if (isConnected && activeTripId) {
      socket.emit('joinTripPlanning', activeTripId);
    }
  }, [activeTripId, isConnected]);

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <SignedOut>
        {/* O que aparece se o usuário NÃO estiver logado */}
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
          // SE NÃO TIVER VIAGEM SELECIONADA -> MOSTRA A DASHBOARD
          <TripList onSelectTrip={setActiveTripId} />
        ) : isLoading ? (
          // 👇 SE TEM VIAGEM, MAS ESTÁ BUSCANDO OS DADOS -> MOSTRA O LOADING AQUI!
          <div className="flex flex-col items-center justify-center py-32 text-slate-500 gap-4">
            <Loader2 className="animate-spin text-blue-600" size={48} />
            <p className="font-medium">Carregando roteiro...</p>
          </div>
        ) : (
          // SE TIVER VIAGEM SELECIONADA -> MOSTRA O ROTEIRO
          <>
            {/* Botão de voltar (opcional, mas muito bom para a UX) */}
            <button
              onClick={() => {
                setActiveTripId(null);
                socket.disconnect(); // Desconecta da sala ao voltar
                setInitialData([], []); // Limpa os dados locais para evitar "fantasmas" de viagens anteriores
              }}
              className="mb-4 text-slate-500 hover:text-blue-600 font-medium text-sm flex items-center gap-1"
            >
              ← Voltar para Minhas Viagens
            </button>

            <Header isConnected={isConnected} onlineUsers={onlineUsers} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <AddDestinationForm tripId={activeTripId} /> {/* <- Importante passar o ID pro Form se ele precisar */}
              </div>
              <div className="md:col-span-2">
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