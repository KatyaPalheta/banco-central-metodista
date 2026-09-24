import React, { useState } from 'react';
import { LogOut, Users, FileCheck2, GraduationCap } from 'lucide-react';
import { authService } from '../services/authService';
import { LoginCard } from '../components/Professor/LoginCard';
import { ContasTab } from '../components/Professor/ContasTab';
import { OperacoesTab } from '../components/Professor/OperacoesTab';

export const ProfessorView: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authService.isAuthenticated());
  const [activeTab, setActiveTab] = useState<'contas' | 'operacoes'>('contas');

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="py-8">
        <LoginCard onSuccess={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Barra de Identificação do Professor Logado */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 sm:p-6 border border-sky-100 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Painel do Professor / Coordenação
            </span>
            <h1 className="font-fredoka text-xl sm:text-2xl font-bold text-slate-900">
              Escola Municipal Metodista de Queimados
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Alternador de Abas */}
          <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('contas')}
              className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'contas'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Contas
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('operacoes')}
              className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'operacoes'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              Operações Pendentes
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
            title="Sair da Área do Professor"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conteúdo da Aba Selecionada */}
      {activeTab === 'contas' && <ContasTab />}
      {activeTab === 'operacoes' && <OperacoesTab />}
    </div>
  );
};
