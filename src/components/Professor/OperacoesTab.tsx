import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Filter, AlertCircle, Check } from 'lucide-react';
import { Operation, TurmaId } from '../../domain/types';
import { operationRepository } from '../../repositories/operationRepository';
import { formatQueimacash, formatDateTime } from '../../utils/normalization';
import { soundService } from '../../services/soundService';

export const OperacoesTab: React.FC = () => {
  const [selectedTurma, setSelectedTurma] = useState<TurmaId | 'TODAS'>('TODAS');
  const [pendingOps, setPendingOps] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOperations = async () => {
    setLoading(true);
    try {
      const ops = await operationRepository.getPendingByTurma(
        selectedTurma === 'TODAS' ? undefined : selectedTurma
      );
      setPendingOps(ops);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperations();
  }, [selectedTurma]);

  const handleConfirm = async (op: Operation) => {
    setConfirmingId(op.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await operationRepository.confirmOperation(op.id);
      soundService.playSuccessSound();
      setSuccessMessage(
        `Operação ${op.protocolo} (${op.tipo}) de ${op.alunoNome} confirmada com sucesso! O saldo foi atualizado.`
      );
      await loadOperations();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Erro ao confirmar operação.');
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div>
      {/* Barra de Filtro e Resumo */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-fredoka text-2xl font-bold text-slate-900">
            Operações Pendentes de Validação
          </h2>
          <p className="text-xs text-slate-500">
            Confira o comprovante físico impresso entregue pelo aluno e confirme a transação.
          </p>
        </div>

        {/* Filtro por Turma */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Turma:
          </span>
          {(['TODAS', '401', '402', '501', '502'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTurma(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTurma === t
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 font-bold text-xs">
            OK
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Lista de Operações */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm">
          Carregando operações pendentes...
        </div>
      ) : pendingOps.length === 0 ? (
        <div className="py-16 text-center bg-white/70 backdrop-blur-md rounded-3xl border border-sky-100 p-8">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="font-fredoka text-xl font-bold text-slate-800 mb-1">
            Nenhuma operação pendente no momento!
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Todas as transações emitidas pelos alunos no Caixa já foram confirmadas ou não há solicitações em aberto para a turma selecionada.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingOps.map((op) => {
            const isDeposito = op.tipo === 'DEPOSITO';
            const isSaque = op.tipo === 'SAQUE';
            const isResgate = op.tipo === 'RESGATE_INVESTIMENTO';

            const badgeBg = isDeposito
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : isSaque
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-purple-100 text-purple-800 border-purple-300';

            const valorExibicao = isResgate
              ? op.detalhes?.valorLiquido ?? op.valor
              : op.valor;

            return (
              <div
                key={op.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-wrap items-center justify-between gap-4"
              >
                {/* Detalhes da Operação */}
                <div className="flex-1 min-w-[280px]">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeBg}`}
                    >
                      {isDeposito && 'DEPÓSITO PENDENTE'}
                      {isSaque && 'SAQUE PENDENTE'}
                      {isResgate && 'RESGATE DE INVESTIMENTO'}
                    </span>

                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {op.protocolo}
                    </span>

                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(op.dataHora)}
                    </span>
                  </div>

                  <div className="font-fredoka text-lg font-bold text-slate-900">
                    {op.alunoNome}
                  </div>

                  <div className="text-xs text-slate-500 font-semibold mt-0.5">
                    Turma {op.turma} · Conta nº {op.numeroConta}
                    {isResgate && op.detalhes?.opcaoTitulo && (
                      <span className="ml-2 text-purple-700">
                        (Modalidade: {op.detalhes.opcaoTitulo})
                      </span>
                    )}
                  </div>
                </div>

                {/* Valor e Ação */}
                <div className="flex items-center gap-5 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] uppercase font-bold text-slate-400 block">
                      {isDeposito ? 'A Entregar' : isSaque ? 'A Retirar' : 'A Creditar'}
                    </span>
                    <span
                      className={`font-fredoka text-2xl font-bold ${
                        isDeposito
                          ? 'text-emerald-600'
                          : isSaque
                          ? 'text-amber-600'
                          : 'text-purple-600'
                      }`}
                    >
                      {formatQueimacash(valorExibicao)}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={confirmingId === op.id}
                    onClick={() => handleConfirm(op)}
                    className="py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-fredoka font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {confirmingId === op.id ? 'Confirmando...' : 'CONFIRMAR'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
