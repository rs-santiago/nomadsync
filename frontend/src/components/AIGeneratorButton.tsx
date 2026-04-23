import { useState, useEffect } from 'react';
import { socket } from '../lib/socket'; 
import { Sparkles, Loader2 } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';

interface AIGeneratorProps {
  tripId: string;
  destinationId: string; // 👈 Adicionamos aqui
  destinationName: string;
}

export function AIGeneratorButton({ tripId, destinationId, destinationName }: AIGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const addLocalActivity = useTripStore(state => state.addLocalActivity);

  useEffect(() => {
    const handleSuccess = (newActivities: any[]) => {
      setIsGenerating(false);
      
      // Adiciona as atividades recebidas no estado global do Zustand
      newActivities.forEach(activity => {
          addLocalActivity(activity);
      });
    };

    const handleError = (errorMessage: string) => {
      setIsGenerating(false);
      alert(`Erro na IA: ${errorMessage}`);
    };

    socket.on('activitiesGeneratedByAI', handleSuccess);
    socket.on('error_message', handleError);

    return () => {
      socket.off('activitiesGeneratedByAI', handleSuccess);
      socket.off('error_message', handleError);
    };
  }, [addLocalActivity]);

  const handleGenerateClick = () => {
    setIsGenerating(true);
    // Emite com o payload completo
    socket.emit('requestAIItinerary', { 
      tripId, 
      destinationId,
      destinationName 
    });
  };

  return (
    <button
      onClick={handleGenerateClick}
      disabled={isGenerating}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>A IA está planejando...</span>
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>Gerar Roteiro Mágico</span>
        </>
      )}
    </button>
  );
}