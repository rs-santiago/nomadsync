import { useState } from 'react';
import { useTripStore } from '../store/useTripStore';
import { socket } from '../lib/socket';

interface AddDestinationFormProps {
  tripId: string;
}

export function AddDestinationForm({ tripId }: AddDestinationFormProps) {
  const [newDestination, setNewDestination] = useState('');
  const addLocalDestination = useTripStore((state) => state.addLocalDestination);

  const handleAddDestination = (e: React.FormEvent) => {
    e.preventDefault(); // Impede a página de recarregar
    
    if (!newDestination.trim()) {
      console.log("O campo de texto está vazio!");
      return;
    }

    console.log("Adicionando na viagem:", tripId);

    const newId = `dest-${Date.now()}`;
    
    // 1. Atualiza a tela (Optimistic UI)
    addLocalDestination({ id: newId, name: newDestination });
    
    // 2. Manda pro backend
    socket.emit('newDestinationAdded', { 
      tripId: tripId, 
      destinationName: newDestination, 
      destinationId: newId 
    });
    
    // 3. Limpa o texto
    setNewDestination('');
  };

  return (
    // Certifique-se de que a tag é <form> e tem o onSubmit!
    <form onSubmit={handleAddDestination} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
      <h3 className="font-bold text-slate-800">Nova Parada</h3>
      <input 
        type="text" 
        placeholder="Ex: Paris, França" 
        value={newDestination}
        onChange={(e) => setNewDestination(e.target.value)}
        className="border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors"
      />
      <button 
        type="submit" 
        className="bg-slate-900 text-white rounded-xl p-3 font-bold hover:bg-slate-800 transition-colors"
      >
        + Adicionar ao Roteiro
      </button>
    </form>
  );
}