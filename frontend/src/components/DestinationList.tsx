import { useState, useEffect } from 'react';
import { MapPin, Trash2, ChevronDown, ChevronUp, Plane, Bed, Utensils, Landmark, Plus, GripVertical, Sparkles } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { ActivityType } from '../store/useTripStore';
import { socket } from '../lib/socket';

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useAuth } from '@clerk/clerk-react';
import { AIGeneratorButton } from './AIGeneratorButton';

interface DestinationListProps {
  tripId: string;
  imageUrl?: string;
}

export function DestinationList({ tripId }: DestinationListProps) {
  const { destinations, activities, removeLocalDestination, addLocalActivity, removeLocalActivity, reorderDestinations } = useTripStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const setFocusedDestination = useTripStore((state) => state.setFocusedDestination);
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityType, setNewActivityType] = useState<ActivityType>('other');
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    // Só tenta conectar se o Clerk já carregou, se o usuário tá logado e se temos a viagem
    if (!isLoaded || !isSignedIn || !tripId) return;

    const iniciarConexaoSegura = async () => {
      try {
        const token = await getToken();
        socket.auth = { token };
        socket.connect();
      } catch (error) {
        console.error("Erro ao autenticar o socket:", error);
      }
    };

    // Criamos uma função separada para ouvir quando o socket ESTIVER pronto
    const handleConnect = () => {
      socket.emit('joinTripPlanning', tripId);
    };

    // Mandamos o socket avisar quando conectar
    socket.on('connect', handleConnect);

    // Damos o play na conexão
    iniciarConexaoSegura();

    // 🧹 Limpeza blindada: removemos o "ouvinte" antes de desconectar
    return () => {
      socket.off('connect', handleConnect);
      socket.disconnect();
    };
  }, [isLoaded, isSignedIn, tripId]);

  // Função disparada quando você solta o item
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const startIndex = result.source.index;
    const endIndex = result.destination.index;

    reorderDestinations(startIndex, endIndex);

    socket.emit('reorderDestinations', {
      tripId: tripId,
      startIndex,
      endIndex
    });
  };

  // Helpers de Interface
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleFocus = (dest: any) => {
    toggleExpand(dest.id);
    if (!dest.latitude || !dest.longitude) {
      return;
    }
    setFocusedDestination(dest.id);
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'flight': return <Plane size={16} className="text-blue-500" />;
      case 'hotel': return <Bed size={16} className="text-purple-500" />;
      case 'restaurant': return <Utensils size={16} className="text-orange-500" />;
      case 'museum': return <Landmark size={16} className="text-green-500" />;
      default: return <MapPin size={16} className="text-slate-400" />;
    }
  };

  // Funções de Ação (Destinos)
  const handleDeleteDestination = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm("Tem certeza que deseja remover este destino?")) return;

    try {
      const token = await getToken();
      await fetch(`${import.meta.env.VITE_API_URL}/destinations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      removeLocalDestination(id);
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  // Funções de Ação (Atividades)
  const handleAddActivity = async (destId: string, tripId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityTitle.trim() || isSubmittingActivity) return;

    setIsSubmittingActivity(true);

    try {
      const token = await getToken();
      // Salva no Banco de Dados REAL
      const response = await fetch(`${import.meta.env.VITE_API_URL}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newActivityTitle,
          type: newActivityType,
          destinationId: destId,
          tripId: tripId,
          cost: 0
        })
      });

      if (!response.ok) throw new Error("Erro ao salvar atividade no servidor");

      const savedActivity = await response.json();

      // Atualiza a tela com o dado que veio do banco (com ID verdadeiro)
      addLocalActivity(savedActivity);

      // Emite via Socket para outros usuários
      // socket.emit('addActivity', { tripId: tripId, activity: savedActivity });

      // Limpa os campos
      setNewActivityTitle('');
      setNewActivityType('other');
    } catch (error) {
      console.error("Erro ao adicionar atividade:", error);
      alert("Falha ao salvar a atividade.");
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm("Remover esta atividade?")) return;

    try {
      const token = await getToken();
      // Rota de deleção (você precisará criar isso no backend depois!)
      await fetch(`${import.meta.env.VITE_API_URL}/activities/${activityId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      removeLocalActivity(activityId);
      socket.emit('removeActivity', { tripId: tripId, activityId });
    } catch (error) {
      console.error("Erro ao deletar atividade:", error);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
        <MapPin size={20} className="text-blue-600" />
        Roteiro da Viagem
      </h2>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="destinations">
          {(provided) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {destinations.map((dest, index) => {
                const isExpanded = expandedId === dest.id;
                const destActivities = activities.filter(a => a.destinationId === dest.id);

                return (
                  <Draggable key={dest.id} draggableId={dest.id} index={index}>
                    {(provided, snapshot) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white rounded-xl shadow-sm border ${snapshot.isDragging ? 'border-blue-500 shadow-lg ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'} overflow-hidden transition-all`}
                      >
                        <div className="p-4 flex items-center justify-between gap-4 group">
                          <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => handleFocus(dest)}>
                            {/* Ícone de Grip (Arrastar) */}
                            <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-500 transition-colors p-1">
                              <GripVertical size={20} />
                            </div>

                            <div className="bg-slate-100 text-slate-500 font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0">
                              {index + 1}
                            </div>

                            {/* Foto do Unsplash */}
                            <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
                              {dest.imageUrl ? (
                                <img
                                  src={dest.imageUrl}
                                  alt={dest.name}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                              ) : (
                                <MapPin size={20} className="text-slate-400" />
                              )}
                            </div>

                            {/* Nome e Badge */}
                            <div>
                              <span className="text-slate-800 font-medium text-lg block">{dest.name}</span>
                              {(!dest.latitude || !dest.longitude) && (
                                <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 inline-block mt-1">
                                  Sem localização no mapa
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Ações (Deletar e Expandir) */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={(e) => handleDeleteDestination(dest.id, e)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2">
                              <Trash2 size={18} />
                            </button>
                            <div onClick={() => handleFocus(dest)} className="cursor-pointer p-2">
                              {isExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                            </div>
                          </div>
                        </div>

                        {/* ACORDEÃO DAS ATIVIDADES */}
                        {isExpanded && (
                          <div className="p-4 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">

                            {/* Lista de Atividades Atuais */}
                            {destActivities.length > 0 ? (
                              <ul className="space-y-2 mb-4">
                                {destActivities.map(act => (
                                  <li key={act.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-200 transition-colors">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-slate-50 rounded-md">
                                        {getActivityIcon(act.type)}
                                      </div>
                                      <span className="text-slate-700 font-medium text-sm">{act.title}</span>
                                      {/* 🤖 A TAG VISUAL DA IA */}
                                      {act.isAiGenerated && (
                                        <span className="flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full">
                                          <Sparkles size={10} />
                                          IA
                                        </span>
                                      )}
                                    </div>
                                    <button onClick={() => handleDeleteActivity(act.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                      <Trash2 size={16} />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-slate-400 italic mb-4 text-center">Nenhuma atividade planejada.</p>
                            )}
                            <div className="mb-4 flex justify-center">
                              <AIGeneratorButton
                                tripId={tripId}
                                destinationId={dest.id}
                                destinationName={dest.name}
                              />
                            </div>

                            {/* Formulário para adicionar nova Atividade */}
                            <form onSubmit={(e) => handleAddActivity(dest.id, dest.tripId || '', e)} className="flex gap-2">
                              <select
                                value={newActivityType}
                                onChange={(e) => setNewActivityType(e.target.value as ActivityType)}
                                disabled={isSubmittingActivity}
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:border-blue-400 disabled:bg-slate-100"
                              >
                                <option value="flight">Voo</option>
                                <option value="hotel">Hotel</option>
                                <option value="restaurant">Restaurante</option>
                                <option value="museum">Passeio</option>
                                <option value="other">Outro</option>
                              </select>
                              <input
                                type="text"
                                placeholder="O que vamos fazer?..."
                                value={newActivityTitle}
                                onChange={(e) => setNewActivityTitle(e.target.value)}
                                disabled={isSubmittingActivity}
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-400 disabled:bg-slate-100"
                              />
                              <button
                                type="submit"
                                disabled={isSubmittingActivity || !newActivityTitle.trim()}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center disabled:opacity-50 transition-colors"
                              >
                                <Plus size={18} />
                              </button>
                            </form>

                          </div>
                        )}
                      </li>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}