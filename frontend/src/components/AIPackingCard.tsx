import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Briefcase, 
  RefreshCw, 
  Thermometer, 
  Shirt, 
  ShieldCheck, 
  Smartphone,
  CloudSun
} from 'lucide-react';
import { socket } from '../lib/socket';

interface AIPackingList {
  weatherCondition: string;
  temperature: string;
  checklist: {
    clothing: string[];
    essentials: string[];
    gadgets: string[];
  };
  tip: string;
}

interface AIPackingCardProps {
  tripId: string;
}

export function AIPackingCard({ tripId }: AIPackingCardProps) {
  const [packingList, setPackingList] = useState<AIPackingList | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const handlePackingListReceived = (newList: AIPackingList) => {
      setPackingList(newList);
      setIsGenerating(false);
    };

    const handleError = (msg: string) => {
      console.error(msg);
      setIsGenerating(false);
      alert(`Erro ao gerar mala: ${msg}`);
    };

    socket.on('packingListGeneratedByAI', handlePackingListReceived);
    socket.on('error_message', handleError);

    return () => {
      socket.off('packingListGeneratedByAI', handlePackingListReceived);
      socket.off('error_message', handleError);
    };
  }, []);

  const handleRequestPackingList = () => {
    setIsGenerating(true);
    socket.emit('requestAIPackingList', tripId);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6 relative overflow-hidden w-full">
      {/* Detalhe de fundo decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Mala Inteligente & Clima
          </h3>
          <p className="text-xs text-slate-400">
            Baseado na data e nas atividades do seu roteiro.
          </p>
        </div>

        <button
          onClick={handleRequestPackingList}
          disabled={isGenerating}
          className="bg-cyan-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-cyan-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all w-full sm:w-auto shadow-sm"
        >
          {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Briefcase size={16} />}
          {isGenerating ? 'Analisando clima...' : packingList ? 'Refazer Mala' : 'Gerar Mala com IA'}
        </button>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="relative z-10">
        
        {/* ESTADO 1: Carregando */}
        {isGenerating && !packingList && (
           <div className="py-12 flex flex-col items-center justify-center text-slate-500 animate-pulse bg-slate-50 rounded-xl border border-dashed border-slate-200">
             <Briefcase className="w-8 h-8 text-cyan-400 animate-bounce mb-3" />
             <p className="text-sm text-center">Cruzando dados meteorológicos com suas atividades...</p>
           </div>
        )}

        {/* ESTADO 2: Vazio */}
        {!packingList && !isGenerating && (
           <div className="py-12 flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
             <CloudSun className="w-8 h-8 text-slate-300 mb-2" />
             <p className="text-sm text-center px-4 max-w-md">
               Clique no botão acima para a IA analisar o histórico de clima do destino e sugerir exatamente o que você deve levar na mala.
             </p>
           </div>
        )}

        {/* ESTADO 3: Preenchido */}
        {packingList && !isGenerating && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            
            {/* NOVO LAYOUT: Clima na Esquerda, Listas na Direita */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* ESQUERDA: Banner de Clima e Dica da IA */}
              <div className="flex flex-col gap-4">
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 rounded-xl p-5 shadow-sm">
                  <div className="bg-white p-3 rounded-full shadow-sm w-fit text-cyan-600 mb-4">
                    <Thermometer size={24} />
                  </div>
                  <p className="text-xs font-bold text-cyan-800 uppercase tracking-wide mb-1">Previsão Esperada</p>
                  <h4 className="text-lg font-bold text-slate-800 leading-tight mb-2">{packingList.weatherCondition}</h4>
                  <p className="text-sm font-medium text-cyan-700 bg-white/50 inline-block px-3 py-1 rounded-md border border-cyan-100/50">
                    {packingList.temperature}
                  </p>
                </div>

                <div className="bg-cyan-50/50 border-l-4 border-cyan-500 rounded-r-xl p-4 flex items-start gap-3 h-full">
                  <Sparkles className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 leading-relaxed font-medium italic">
                    "{packingList.tip}"
                  </p>
                </div>
              </div>

              {/* DIREITA: As 3 colunas do Checklist */}
              <div className="md:col-span-2 bg-slate-50 rounded-xl p-6 border border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  
                  {/* Roupas */}
                  <div>
                    <h5 className="flex items-center gap-2 font-semibold text-slate-700 mb-4 border-b border-slate-200 pb-2">
                      <Shirt size={16} className="text-blue-500" /> Vestuário
                    </h5>
                    <ul className="space-y-3">
                      {packingList.checklist.clothing.map((item, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2 leading-tight">
                          <span className="text-cyan-500 mt-0.5">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Essenciais */}
                  <div>
                    <h5 className="flex items-center gap-2 font-semibold text-slate-700 mb-4 border-b border-slate-200 pb-2">
                      <ShieldCheck size={16} className="text-orange-500" /> Essenciais
                    </h5>
                    <ul className="space-y-3">
                      {packingList.checklist.essentials.map((item, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2 leading-tight">
                          <span className="text-orange-400 mt-0.5">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Eletrônicos & Gadgets */}
                  <div>
                    <h5 className="flex items-center gap-2 font-semibold text-slate-700 mb-4 border-b border-slate-200 pb-2">
                      <Smartphone size={16} className="text-purple-500" /> Eletrônicos
                    </h5>
                    <ul className="space-y-3">
                      {packingList.checklist.gadgets.map((item, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2 leading-tight">
                          <span className="text-purple-400 mt-0.5">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}