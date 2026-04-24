import { useState, useEffect } from 'react';
import { Sparkles, Wallet, RefreshCw, Coffee, Car, Ticket, Home } from 'lucide-react';
import { socket } from '../lib/socket';

interface AIBudgetEstimate {
  currency: string;
  total: number;
  breakdown: {
    food: number;
    transport: number;
    leisure: number;
    accommodation: number;
  };
  tips: string;
}

interface AIBudgetCardProps {
  tripId: string;
  destinationNames: string;
}

export function AIBudgetCard({ tripId, destinationNames }: AIBudgetCardProps) {
  const [budget, setBudget] = useState<AIBudgetEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('BRL');

  useEffect(() => {
    const handleBudgetReceived = (newBudget: AIBudgetEstimate) => {
      setBudget(newBudget);
      setIsEstimating(false);
    };

    const handleError = (msg: string) => {
      console.error(msg);
      setIsEstimating(false);
      alert(`Erro ao calcular orçamento: ${msg}`);
    };

    socket.on('budgetGeneratedByAI', handleBudgetReceived);
    socket.on('error_message', handleError);

    return () => {
      socket.off('budgetGeneratedByAI', handleBudgetReceived);
      socket.off('error_message', handleError);
    };
  }, []);

  const handleRequestBudget = () => {
    setIsEstimating(true);
    socket.emit('requestAIBudget', { 
      tripId, 
      destinationName: destinationNames || "Vários destinos",
      currency: selectedCurrency
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6 relative overflow-hidden">
      {/* Detalhe de fundo decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

      {/* Cabeçalho: Título, Seletor de Moeda e Botão */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Orçamento Inteligente
          </h3>
          
          {/* Seletor de Moeda */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
            {['BRL', 'USD', 'EUR'].map((curr) => (
              <button
                key={curr}
                onClick={() => setSelectedCurrency(curr)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  selectedCurrency === curr 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleRequestBudget}
          disabled={isEstimating}
          className="bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all w-full sm:w-auto shadow-sm"
        >
          {isEstimating ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
          {isEstimating ? 'Calculando...' : budget ? 'Recalcular' : 'Gerar Orçamento'}
        </button>
      </div>

      {/* ÁREA DE CONTEÚDO (Muda conforme o estado) */}
      <div className="relative z-10">
        
        {/* ESTADO 1: Carregando */}
        {isEstimating && !budget && (
           <div className="py-8 flex flex-col items-center justify-center text-slate-500 animate-pulse">
             <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mb-3" />
             <p className="text-sm text-center">A IA está analisando suas atividades e o custo de vida local...</p>
           </div>
        )}

        {/* ESTADO 2: Vazio (Ainda não clicou) */}
        {!budget && !isEstimating && (
           <div className="py-8 flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
             <Wallet className="w-8 h-8 text-slate-300 mb-2" />
             <p className="text-sm text-center px-4 max-w-md">
               Selecione a moeda desejada e clique no botão acima para a IA analisar seu roteiro e estimar os custos da viagem.
             </p>
           </div>
        )}

        {/* ESTADO 3: Preenchido (Resultado da IA) */}
        {budget && !isEstimating && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="text-4xl font-bold text-slate-800 mb-6 flex items-baseline gap-2">
              <span className="text-2xl text-slate-400 font-medium">{budget.currency}</span>
              {budget.total.toLocaleString('pt-BR')}
            </div>

            {/* Breakdown em 4 colunas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-center justify-center text-center hover:border-purple-200 transition-colors">
                <Home size={18} className="text-purple-500 mb-1" />
                <span className="text-xs text-slate-500 mb-0.5">Hospedagem</span>
                <span className="text-sm font-bold text-slate-700">{budget.currency} {budget.breakdown.accommodation}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-center justify-center text-center hover:border-purple-200 transition-colors">
                <Coffee size={18} className="text-orange-500 mb-1" />
                <span className="text-xs text-slate-500 mb-0.5">Alimentação</span>
                <span className="text-sm font-bold text-slate-700">{budget.currency} {budget.breakdown.food}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-center justify-center text-center hover:border-purple-200 transition-colors">
                <Car size={18} className="text-blue-500 mb-1" />
                <span className="text-xs text-slate-500 mb-0.5">Transporte</span>
                <span className="text-sm font-bold text-slate-700">{budget.currency} {budget.breakdown.transport}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-center justify-center text-center hover:border-purple-200 transition-colors">
                <Ticket size={18} className="text-green-500 mb-1" />
                <span className="text-xs text-slate-500 mb-0.5">Lazer</span>
                <span className="text-sm font-bold text-slate-700">{budget.currency} {budget.breakdown.leisure}</span>
              </div>
            </div>

            {/* Dica de Ouro da IA */}
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <p className="text-sm text-purple-900 leading-relaxed italic font-medium">
                "{budget.tips}"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}