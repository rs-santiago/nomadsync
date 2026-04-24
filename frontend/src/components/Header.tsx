import { UserButton } from '@clerk/clerk-react';
import { Plane, Activity, Link as LinkIcon, Calendar } from 'lucide-react'; // 👈 Adicionamos o Calendar

interface HeaderProps {
  isConnected: boolean;
  onlineUsers: { id: string, name: string, color: string }[];
  tripId: string;
  // 👈 NOVAS PROPS AQUI
  tripName?: string; 
  startDate?: Date | string | null;
  endDate?: Date | string | null;
}

export function Header({ 
  isConnected, 
  onlineUsers, 
  tripId,
  tripName = "Carregando viagem...", // Fallback enquanto a API carrega
  startDate,
  endDate
}: HeaderProps) {
  
  // Função para copiar o link
  const handleCopyLink = () => {
    const link = window.location.origin + "?invite=" + tripId;
    navigator.clipboard.writeText(link);
    alert("Link de convite copiado! Envie para seus amigos. ✈️");
  };

  // Função para formatar as datas lindamente (Ex: "15 a 25 de Julho, 2026")
  const formatDateRange = (start?: Date | string | null, end?: Date | string | null) => {
    if (!start || !end) return "Datas a definir";
    
    // Tratamos as datas considerando fuso horário para não dar erro de "dia anterior"
    const dStart = new Date(start);
    const dEnd = new Date(end);
    
    // Força a data para UTC para evitar problemas de timezone ao exibir o dia
    const startDay = dStart.getUTCDate();
    const endDay = dEnd.getUTCDate();
    const month = dStart.toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' });
    const year = dStart.getUTCFullYear();

    // Se for no mesmo mês e ano
    if (dStart.getUTCMonth() === dEnd.getUTCMonth() && dStart.getUTCFullYear() === dEnd.getUTCFullYear()) {
      return `${startDay} a ${endDay} de ${month}, ${year}`;
    }
    
    return `${dStart.toLocaleDateString('pt-BR', {timeZone: 'UTC'})} até ${dEnd.toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`;
  };

  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 gap-4">
      
      {/* ESQUERDA: Ícone + Título Protagonista + Datas */}
      <div className="flex items-center gap-4">
        <div className="bg-blue-600 p-3 rounded-xl text-white shadow-sm shrink-0">
          <Plane size={24} />
        </div>
        <div>
          {/* Nome da Viagem agora é o H1 principal */}
          <h1 className="text-xl font-bold text-slate-800 leading-tight">
            {tripName}
          </h1>
          
          {/* O subtítulo agora são as datas dinâmicas */}
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
            <Calendar size={14} className="text-slate-400" />
            <span className="font-medium">{formatDateRange(startDate, endDate)}</span>
          </div>
        </div>
      </div>

      {/* DIREITA: Ações, Avatares e Status */}
      <div className="flex items-center flex-wrap gap-4 w-full md:w-auto">
        
        {/* BOTÃO DE CONVIDAR */}
        <button 
          onClick={handleCopyLink}
          className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl text-sm font-semibold transition-colors border border-indigo-100 shrink-0"
        >
          <LinkIcon size={16} />
          Convidar
        </button>

        {/* Avatares de Presença Reais do Socket */}
        {onlineUsers && onlineUsers.length > 0 && (
          <div className="flex -space-x-3 overflow-hidden shrink-0">
            {onlineUsers.map((user, index) => (
              <div 
                key={`${user.id}-${index}`}
                title={user.name}
                style={{ backgroundColor: user.color }}
                className="inline-flex h-10 w-10 rounded-full border-2 border-white items-center justify-center text-white text-xs font-bold shadow-sm z-10"
              >
                {user.name.substring(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
        )}

        {/* Perfil do Clerk */}
        <div className="shrink-0 flex items-center">
          <UserButton afterSignOutUrl="/" />
        </div>

        {/* Badge de Conexão com cores do Tailwind atualizadas */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold shrink-0 ${isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          <Activity size={16} />
          {isConnected ? 'Sincronizado' : 'Desconectado'}
        </div>
      </div>
    </header>
  );
}