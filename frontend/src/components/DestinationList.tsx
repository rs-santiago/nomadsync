import { useState } from 'react';
import { MapPin, Trash2, ChevronDown, ChevronUp, Plane, Bed, Utensils, Landmark, Plus, GripVertical } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { ActivityType } from '../store/useTripStore';
import { socket } from '../lib/socket';

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
interface DestinationListProps {
  tripId: string;
  name: string;
  imageUrl?: string;
}

export function DestinationList({ tripId }: DestinationListProps) {
  const { destinations, activities, removeLocalDestination, addLocalActivity, removeLocalActivity, reorderDestinations } = useTripStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityType, setNewActivityType] = useState<ActivityType>('other');

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

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'flight': return <Plane size={16} className="text-blue-500" />;
      case 'hotel': return <Bed size={16} className="text-purple-500" />;
      case 'restaurant': return <Utensils size={16} className="text-orange-500" />;
      case 'museum': return <Landmark size={16} className="text-green-500" />;
      default: return <MapPin size={16} className="text-slate-400" />;
    }
  };

  // Funções de Ação
  const handleDeleteDestination = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que o clique feche/abra o acordeão
    removeLocalDestination(id);
    socket.emit('removeDestination', { tripId: tripId, destinationId: id });
  };

  const handleAddActivity = (destId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityTitle.trim()) return;

    const newActivity = {
      id: `act-${Date.now()}`,
      destinationId: destId,
      title: newActivityTitle,
      type: newActivityType,
      cost: 0
    };

    addLocalActivity(newActivity);
    socket.emit('addActivity', { tripId: tripId, activity: newActivity });

    setNewActivityTitle('');
    setNewActivityType('other');
  };

  const handleDeleteActivity = (activityId: string) => {
    removeLocalActivity(activityId);
    socket.emit('removeActivity', { tripId: tripId, activityId });
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
                // 👇 ADICIONE ESTA LINHA AQUI 👇
                console.log(`Dados do destino ${dest.name}:`, dest);
                return (
                  <Draggable key={dest.id} draggableId={dest.id} index={index}>
                    {(provided, snapshot) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white rounded-xl shadow-sm border ${snapshot.isDragging ? 'border-blue-500 shadow-lg' : 'border-slate-100'} overflow-hidden transition-shadow`}
                      >
                        <div className="p-4 flex items-center justify-between gap-4 group">
                          <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleExpand(dest.id)}>
                            {/* Ícone de "pegar" para arrastar */}
                            <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-500 transition-colors">
                              <GripVertical size={20} />
                            </div>

                            <div className="bg-slate-100 text-slate-500 font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0">
                              {index + 1}
                            </div>

                            {/* 👇 A FOTO DO UNSPLASH ENTRA AQUI 👇 */}
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
                            {/* 👆 FIM DA FOTO 👆 */}

                            <span className="text-slate-800 font-medium text-lg">{dest.name}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button onClick={(e) => handleDeleteDestination(dest.id, e)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 size={18} />
                            </button>
                            {isExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                          </div>
                        </div>

                        {/* CORPO DO ACORDEÃO (Atividades) - MANTIDO EXATAMENTE IGUAL */}
                        {isExpanded && (
                          <div className="p-4 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">

                            {/* Lista de Atividades Atuais */}
                            <ul className="space-y-2 mb-4">
                              {destActivities.map(act => (
                                <li key={act.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 rounded-md">
                                      {getActivityIcon(act.type)}
                                    </div>
                                    <span className="text-slate-700">{act.title}</span>
                                  </div>
                                  <button onClick={() => handleDeleteActivity(act.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                  </button>
                                </li>
                              ))}
                            </ul>

                            {/* Formulário para adicionar nova Atividade */}
                            <form onSubmit={(e) => handleAddActivity(dest.id, e)} className="flex gap-2">
                              <select
                                value={newActivityType}
                                onChange={(e) => setNewActivityType(e.target.value as ActivityType)}
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none"
                              >
                                <option value="flight">Voo</option>
                                <option value="hotel">Hotel</option>
                                <option value="restaurant">Restaurante</option>
                                <option value="museum">Passeio</option>
                                <option value="other">Outro</option>
                              </select>
                              <input
                                type="text"
                                placeholder="Ex: Voo Latam LA3040"
                                value={newActivityTitle}
                                onChange={(e) => setNewActivityTitle(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
                              />
                              <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center">
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