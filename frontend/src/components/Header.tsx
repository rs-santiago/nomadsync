import { UserButton } from '@clerk/clerk-react';
import { Plane, Activity, Link as LinkIcon } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  onlineUsers: { id: string, name: string, color: string }[];
  tripId: string;
}

export function Header({ isConnected, onlineUsers, tripId }: HeaderProps) {
  
  // Função simples para copiar o link da barra de endereços
  const handleCopyLink = () => {
    const link = window.location.origin + "?invite=" + tripId; // Gera o link com o ID da viagem
    navigator.clipboard.writeText(link);
    alert("Link de convite copiado! Envie para seus amigos. ✈️");
  };

  return (
    <header className="flex flex-col md:flex-row items-center justify-between mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-3 rounded-xl text-white">
          <Plane size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">NomadSync</h1>
          <p className="text-slate-500 text-sm">Eurotrip 2026</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* BOTÃO DE CONVIDAR */}
        <button 
          onClick={handleCopyLink}
          className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl text-sm font-semibold transition-colors border border-indigo-100"
        >
          <LinkIcon size={16} />
          Convidar
        </button>

        {/* Avatares de Presença */}
        <div className="flex -space-x-3 overflow-hidden">
          {onlineUsers?.map((user, index) => (
            <div 
              key={`${user.id}-${index}`}
              title={user.name}
              style={{ backgroundColor: user.color }}
              className="inline-block h-10 w-10 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm"
            >
              {user.name.substring(0, 2).toUpperCase()}
            </div>
          ))}
        </div>

        <UserButton afterSignOutUrl="/" />

        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <Activity size={16} />
          {isConnected ? 'Sincronizado' : 'Desconectado'}
        </div>
      </div>
    </header>
  );
}