import { useState } from 'react';
import { useTripStore } from '../store/useTripStore';
import { useAuth } from '@clerk/clerk-react'; // 👈 Importamos o Clerk para segurança

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

    setIsSubmitting(true); // Trava o botão para não dar clique duplo

    try {
      // 1. Pega o token de segurança do usuário logado
      const token = await getToken();

      // 2. Faz o POST para a nossa rota no Backend (que busca a foto e salva no BD)
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
          endDate: null // Por enquanto, criamos a parada sem datas. Depois o usuário pode editar e colocar as datas que quiser!
         })
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar no servidor');
      }

      // 3. Recebe a resposta OFICIAL (agora sim, com ID do Prisma e imageUrl!)
      const savedDestination = await response.json();
      
      console.log("💎 Recebido do Backend após salvar:", savedDestination); // O dado TEM QUE ter imageUrl aqui
      
      // 4. Atualiza a tela com o dado verdadeiro
      addLocalDestination(savedDestination);
      
      // 5. Limpa o texto
      setNewDestination('');
    } catch (error) {
      console.error("Erro ao adicionar destino:", error);
      alert("Ops! Houve um erro ao buscar a foto ou salvar o destino.");
    } finally {
      setIsSubmitting(false); // Libera o botão
    }
  };

  return (
    <form onSubmit={handleAddDestination} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 sticky top-8">
      <h3 className="font-bold text-slate-800">Nova Parada</h3>
      <input 
        type="text" 
        placeholder="Ex: Paris, França" 
        value={newDestination}
        onChange={(e) => setNewDestination(e.target.value)}
        disabled={isSubmitting}
        className="border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors disabled:bg-slate-50 disabled:text-slate-400"
      />
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="bg-slate-900 text-white rounded-xl p-3 font-bold hover:bg-slate-800 transition-colors flex items-center justify-center disabled:bg-slate-400"
      >
        {isSubmitting ? 'Buscando foto...' : '+ Adicionar ao Roteiro'}
      </button>
    </form>
  );
}