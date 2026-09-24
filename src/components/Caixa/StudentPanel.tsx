import React, { useState, useEffect } from 'react';
import {
  LogOut,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Student } from '../../domain/types';
import { formatQueimacash } from '../../utils/normalization';
import { DepositModal } from './DepositModal';
import { WithdrawModal } from './WithdrawModal';
import { InvestmentModal } from './InvestmentModal';
import { studentRepository } from '../../repositories/studentRepository';
import { soundService } from '../../services/soundService';
import { investmentRepository } from '../../repositories/investmentRepository';
import { calculateRedemption } from '../../services/investmentConfig';

interface StudentPanelProps {
  student: Student;
  onLogout: () => void;
  onRefreshStudent: (updatedStudent: Student) => void;
}

export const StudentPanel: React.FC<StudentPanelProps> = ({
  student,
  onLogout,
  onRefreshStudent,
}) => {
  const [activeModal, setActiveModal] = useState<'none' | 'deposito' | 'saque' | 'investir'>('none');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [investmentSummary, setInvestmentSummary] = useState({
  valorAplicado: 0,
  valorAtual: 0,
});

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const refreshFinancialData = async () => {
  const [updatedStudent, investments] = await Promise.all([
    studentRepository.getById(student.id),
    investmentRepository.getByStudent(student.id),
  ]);

  if (updatedStudent) {
    onRefreshStudent(updatedStudent);
  }

  const investimentosEmAberto = investments.filter(
    (inv) =>
      inv.status === 'ATIVO' ||
      inv.status === 'RESGATE_PENDENTE'
  );

  const valorAplicado = investimentosEmAberto.reduce(
    (total, inv) => total + inv.valorAplicado,
    0
  );

  const valorAtual = investimentosEmAberto.reduce((total, inv) => {
    // Se o resgate já foi solicitado, mantém o valor calculado
    // até o professor confirmar.
    if (inv.status === 'RESGATE_PENDENTE') {
      return total + inv.valorResgateCalculado;
    }

    return total + calculateRedemption(inv).valorTotalReceber;
  }, 0);

  setInvestmentSummary({
    valorAplicado: Number(valorAplicado.toFixed(2)),
    valorAtual: Number(valorAtual.toFixed(2)),
  });
};
useEffect(() => {
  void refreshFinancialData();
}, [student.id]);

  const handleExit = () => {
    soundService.playNoteSound(10);
    onLogout();
  };
const patrimonioTotal = Number(
  (student.saldo + investmentSummary.valorAtual).toFixed(2)
);
  return (
    <div className="max-w-3xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-fredoka font-semibold shadow-xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Cartão de Identificação do Aluno e Saldo */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-2 border-sky-100 shadow-xl shadow-sky-900/10 mb-8 relative overflow-hidden">
        {/* Fundo decorativo suave */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-100/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-100/40 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-2">
              <span>🎒</span> Conta Escolar nº {student.numeroConta}
            </div>
            <h1 className="font-fredoka text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Olá, {student.nome}!
            </h1>
            <p className="text-slate-600 text-sm font-semibold mt-0.5">
              Turma {student.turma} ({student.turma.endsWith('1') ? 'Turno da Manhã' : 'Turno da Tarde'})
            </p>
          </div>

          <button
            type="button"
            onClick={handleExit}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer border border-slate-200"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>SAIR DO CAIXA</span>
          </button>
        </div>

                {/* Composição financeira do aluno */}
        <div className="relative z-10 space-y-3">

          {/* SALDO DISPONÍVEL — informação principal */}
          <div className="bg-emerald-50 rounded-3xl p-6 sm:p-8 border border-emerald-200 text-center">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-800">
              Saldo disponível
            </span>

            <div className="font-fredoka text-4xl sm:text-5xl font-bold text-emerald-600 my-2">
              {formatQueimacash(student.saldo)}
            </div>

            <p className="text-xs sm:text-sm text-slate-500">
              Valor disponível para usar, sacar ou investir.
            </p>
          </div>

          {/* Informações secundárias */}
          <div className="grid grid-cols-2 gap-3">

            {/* INVESTIMENTOS */}
            <div className="bg-purple-50 rounded-xl px-3 py-3 border border-purple-200">
              <div className="text-[10px] font-extrabold uppercase tracking-wide text-purple-700">
                Guardado em investimentos
              </div>

              <div className="font-fredoka text-xl font-bold text-purple-600 mt-1">
                {formatQueimacash(investmentSummary.valorAtual)}
              </div>

              <div className="text-[10px] text-slate-500 mt-1">
                Valor aplicado: {formatQueimacash(investmentSummary.valorAplicado)}
              </div>
            </div>

            {/* TOTAL */}
            <div className="bg-sky-50 rounded-xl px-3 py-3 border border-sky-200">
              <div className="text-[10px] font-extrabold uppercase tracking-wide text-sky-700">
                Total que você tem
              </div>

              <div className="font-fredoka text-xl font-bold text-sky-600 mt-1">
                {formatQueimacash(patrimonioTotal)}
              </div>

              <div className="text-[10px] text-slate-500 mt-1">
                Conta + investimentos
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Grid com Exatamente as 4 Ações Oficiais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Ação 1: DEPOSITAR */}
        <button
          type="button"
          onClick={() => {
            soundService.playNoteSound(20);
            setActiveModal('deposito');
          }}
          className="p-6 rounded-3xl bg-white hover:bg-emerald-50/80 active:scale-95 border-2 border-emerald-200 shadow-md shadow-emerald-900/5 hover:border-emerald-400 transition-all flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ArrowDownCircle className="w-9 h-9" />
          </div>
          <span className="font-fredoka text-xl font-bold text-slate-900 group-hover:text-emerald-800 mb-1">
            DEPOSITAR
          </span>
          <span className="text-xs text-slate-500 leading-relaxed">
            Guarde seu Queimacash e emita seu comprovante
          </span>
        </button>

        {/* Ação 2: SACAR */}
        <button
          type="button"
          onClick={() => {
            soundService.playNoteSound(20);
            setActiveModal('saque');
          }}
          className="p-6 rounded-3xl bg-white hover:bg-amber-50/80 active:scale-95 border-2 border-amber-200 shadow-md shadow-amber-900/5 hover:border-amber-400 transition-all flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ArrowUpCircle className="w-9 h-9" />
          </div>
          <span className="font-fredoka text-xl font-bold text-slate-900 group-hover:text-amber-800 mb-1">
            SACAR
          </span>
          <span className="text-xs text-slate-500 leading-relaxed">
            Retire seu Queimacash para usar com o professor
          </span>
        </button>

        {/* Ação 3: INVESTIR */}
        <button
          type="button"
          onClick={() => {
            soundService.playNoteSound(20);
            setActiveModal('investir');
          }}
          className="p-6 rounded-3xl bg-white hover:bg-purple-50/80 active:scale-95 border-2 border-purple-200 shadow-md shadow-purple-900/5 hover:border-purple-400 transition-all flex flex-col items-center text-center group cursor-pointer"
        >
          <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-9 h-9" />
          </div>
          <span className="font-fredoka text-xl font-bold text-slate-900 group-hover:text-purple-800 mb-1">
            INVESTIR
          </span>
          <span className="text-xs text-slate-500 leading-relaxed">
            Aplique seu saldo ou solicite resgate
          </span>
        </button>
      </div>

      {/* Botão de Saída Principal */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleExit}
          className="py-4 px-8 rounded-2xl bg-slate-200/80 hover:bg-rose-100 active:scale-98 text-slate-700 hover:text-rose-800 font-fredoka font-bold text-base transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <LogOut className="w-5 h-5 text-rose-500" />
          ENCERRAR SESSÃO E SAIR
        </button>
      </div>

      {/* Modais das operações */}
      {activeModal === 'deposito' && (
        <DepositModal
          student={student}
          onClose={() => setActiveModal('none')}
          onSuccess={(protocolo) => {
            setActiveModal('none');
            showNotification(`Comprovante ${protocolo} emitido! Entregue ao professor.`);
            refreshFinancialData();
          }}
        />
      )}

      {activeModal === 'saque' && (
        <WithdrawModal
          student={student}
          onClose={() => setActiveModal('none')}
          onSuccess={(protocolo) => {
            setActiveModal('none');
            showNotification(`Comprovante ${protocolo} emitido! Apresente ao professor.`);
            refreshFinancialData();
          }}
        />
      )}

      {activeModal === 'investir' && (
       <InvestmentModal
  student={student}

  onClose={async () => {
    await refreshFinancialData();
    setActiveModal('none');
  }}

  onSuccessApplication={async () => {
    await refreshFinancialData();
    setActiveModal('none');

    showNotification(
      'Aplicação em investimento concluída com sucesso!'
    );
  }}

  onSuccessRedemption={async (protocolo) => {
    await refreshFinancialData();
    setActiveModal('none');

    showNotification(
      `Solicitação de resgate ${protocolo} impressa! Apresente ao professor.`
    );
  }}
/>
      )}
    </div>
  );
};
