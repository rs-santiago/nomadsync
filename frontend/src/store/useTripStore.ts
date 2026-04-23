import { create } from 'zustand';

export interface Destination {
  id: string;
  name: string;
  imageUrl?: string | null;
  tripId?: string | null;
  latitude: number | null;
  longitude: number | null;
}

export type ActivityType = 'flight' | 'hotel' | 'restaurant' | 'museum' | 'other';

export interface Activity {
  id: string;
  isAiGenerated: boolean;
  destinationId: string;
  title: string;
  type: ActivityType;
  cost: number;
}

interface TripState {
  destinations: Destination[];
  activities: Activity[]; // 2. Novo estado de atividades
  
  setInitialData: (destinations: Destination[], activities: Activity[]) => void;
  addLocalDestination: (dest: Destination) => void;
  syncRemoteDestination: (dest: Destination) => void;
  removeLocalDestination: (id: string) => void;
  syncRemoveDestination: (id: string) => void;
  reorderDestinations: (startIndex: number, endIndex: number) => void;

  // 3. Novas funções para Atividades
  addLocalActivity: (act: Activity) => void;
  syncRemoteActivity: (act: Activity) => void;
  removeLocalActivity: (id: string) => void;
  syncRemoveActivity: (id: string) => void;

  focusedDestinationId: string | null;
  setFocusedDestination: (id: string | null) => void;
}

export const useTripStore = create<TripState>((set) => ({
  destinations: [],
  activities: [],
  
  setInitialData: (destinations, activities) => 
    set({ destinations, activities }),

  addLocalDestination: (dest) => 
    set((state) => {
        // Verifica se já existe para não duplicar
        const exists = state.destinations.find(d => d.id === dest.id);
        if (exists) return state;
        return { destinations: [...state.destinations, dest] };
    }),
  focusedDestinationId: null,
  setFocusedDestination: (id) => set({ focusedDestinationId: id }),
  syncRemoteDestination: (dest) => 
    set((state) => {
        // Se o destino já existe, atualiza ele (preservando fotos/coordenadas)
        const exists = state.destinations.find(d => d.id === dest.id);
        if (exists) {
        return {
            destinations: state.destinations.map(d => d.id === dest.id ? { ...d, ...dest } : d)
        };
        }
        return { destinations: [...state.destinations, dest] };
    }),

  removeLocalDestination: (id) =>
    set((state) => ({
      destinations: state.destinations.filter((dest) => dest.id !== id),
      // Ao apagar o destino, apagamos as atividades dele também (Cascade)
      activities: state.activities.filter((act) => act.destinationId !== id)
    })),

  syncRemoveDestination: (id) =>
    set((state) => ({
      destinations: state.destinations.filter((dest) => dest.id !== id),
      activities: state.activities.filter((act) => act.destinationId !== id)
    })),

  reorderDestinations: (startIndex, endIndex) =>
    set((state) => {
      const newDestinations = Array.from(state.destinations);
      const [removed] = newDestinations.splice(startIndex, 1);
      newDestinations.splice(endIndex, 0, removed);
      return { destinations: newDestinations };
    }),

  // Implementação das Atividades
  addLocalActivity: (act) =>
    set((state) => ({ activities: [...state.activities, act] })),
    
  syncRemoteActivity: (newActivity) => set((state) => {
    // 🛡️ TRAVA DE SEGURANÇA: Se o ID já existe na tela, ignora e não duplica!
    const activityExists = state.activities.some((a) => a.id === newActivity.id);
    if (activityExists) {
      return state; 
    }

    // Se é nova, adiciona no final da lista
    return { activities: [...state.activities, newActivity] };
  }),

  removeLocalActivity: (id) =>
    set((state) => ({ activities: state.activities.filter(act => act.id !== id) })),

  syncRemoveActivity: (id) =>
    set((state) => ({ activities: state.activities.filter(act => act.id !== id) })),
}));