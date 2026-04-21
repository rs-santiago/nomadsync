import { create } from 'zustand';

export interface Destination {
  id: string;
  name: string;
  imageUrl?: string | null;
}

export type ActivityType = 'flight' | 'hotel' | 'restaurant' | 'museum' | 'other';

export interface Activity {
  id: string;
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
}

export const useTripStore = create<TripState>((set) => ({
  destinations: [],
  activities: [],
  
  setInitialData: (destinations, activities) => 
    set({ destinations, activities }),

  addLocalDestination: (dest) => 
    set((state) => ({ destinations: [...state.destinations, dest] })),
    
  syncRemoteDestination: (dest) => 
    set((state) => ({ destinations: [...state.destinations, dest] })),

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
    
  syncRemoteActivity: (act) =>
    set((state) => ({ activities: [...state.activities, act] })),

  removeLocalActivity: (id) =>
    set((state) => ({ activities: state.activities.filter(act => act.id !== id) })),

  syncRemoveActivity: (id) =>
    set((state) => ({ activities: state.activities.filter(act => act.id !== id) })),
}));