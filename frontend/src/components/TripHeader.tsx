import { Link2, Check, Calendar, Plane } from 'lucide-react';
// import { useTripStore } from '../store/useTripStore'; // Se preferir puxar do Zustand

interface TripHeaderProps {
  tripName: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
}

export function TripHeader({ tripName = "Eurotrip 2026", startDate, endDate }: TripHeaderProps) {
  
  // Função para formatar a data lindamente (Ex: "15 a 25 de Julho, 2026")
  const formatDateRange = (start?: Date | string | null, end?: Date | string | null) => {
    if (!start || !end) return "Datas a definir";
    
    const dStart = new Date(start);
    const dEnd = new Date(end);
    
    const startDay = dStart.getDate();
    const endDay = dEnd.getDate();
    const month = dStart.toLocaleDateString('pt-BR', { month: 'long' });
    const year = dStart.getFullYear();

    // Se for no mesmo mês e ano
    if (dStart.getMonth() === dEnd.getMonth() && dStart.getFullYear() === dEnd.getFullYear()) {
      return `${startDay} a ${endDay} de ${month}, ${year}`;
    }
    
    // Se forem meses diferentes, formata completo
    return `${dStart.toLocaleDateString('pt-BR')} até ${dEnd.toLocaleDateString('pt-BR')}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      
      {/* ESQUERDA: Logo + Informações da Viagem */}
      <div className="flex items-center gap-4">
        {/* Ícone do App (Fica como botão de Home/Voltar) */}
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
          <Plane size={24} />
        </div>
        
        <div>
          {/* Nome da Viagem agora é o título principal */}
          <h1 className="text-xl font-bold text-slate-800 leading-tight">
            {tripName}
          </h1>
          
          {/* Datas da Viagem */}
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
            <Calendar size={14} className="text-slate-400" />
            <span className="font-medium">{formatDateRange(startDate, endDate)}</span>
          </div>
        </div>
      </div>

      {/* DIREITA: Ações, Avatares e Status */}
      <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
        
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm shrink-0">
          <Link2 size={16} />
          Convidar
        </button>

        {/* Grupo de Avatares */}
        <div className="flex -space-x-2 shrink-0">
          <div className="w-9 h-9 rounded-full bg-pink-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white z-10">
            US
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-400 flex items-center justify-center text-white text-xs font-bold border-2 border-white z-0">
            R
          </div>
        </div>

        {/* Badge de Sincronização */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold shrink-0">
          <Check size={16} />
          Sincronizado
        </div>

      </div>
    </div>
  );
}