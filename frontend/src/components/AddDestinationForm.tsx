import { useState } from 'react';
import { useTripStore } from '../store/useTripStore';
import { useAuth } from '@clerk/clerk-react'; 

interface AddDestinationFormProps {
  tripId: string;
}

export function AddDestinationForm({ tripId }: AddDestinationFormProps) {
  const [newDestination, setNewDestination] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const addLocalDestination = useTripStore((state) => state.addLocalDestination);
  const { getToken } = useAuth();

  const handleAddDestination = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    if (!newDestination.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true); 

    try {
      const token = await getToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/destinations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: newDestination,
          tripId: tripId,
          startDate: null, 
          endDate: null 
         })
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar no servidor');
      }

      const savedDestination = await response.json();
      
      addLocalDestination(savedDestination);
      setNewDestination('');
    } catch (error) {
      console.error("Erro ao adicionar destino:", error);
      alert("Ops! Houve um erro ao buscar a foto ou salvar o destino.");
    } finally {
      setIsSubmitting(false); 
    }
  };

  return (
    <form 
      onSubmit={handleAddDestination} 
      className="bg-white p-5 shrink-0 z-10 relative border-b border-slate-200 flex flex-col gap-3"
    >
      <h3 className="text-lg font-bold text-slate-800">Nova Parada</h3>
      
      <input 
        type="text" 
        placeholder="Ex: Paris, França" 
        value={newDestination}
        onChange={(e) => setNewDestination(e.target.value)}
        disabled={isSubmitting}
        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 transition-colors"
      />
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full bg-slate-900 text-white font-medium py-2.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center disabled:bg-slate-400"
      >
        {isSubmitting ? 'Buscando foto...' : '+ Adicionar ao Roteiro'}
      </button>
    </form>
  );
}