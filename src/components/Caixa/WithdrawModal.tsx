import React, { useState, useEffect } from 'react';
import { X, ArrowUpCircle, Printer, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Student } from '../../domain/types';
import { formatQueimacash, generateProtocol, formatDateTime } from '../../utils/normalization';
import { buildReceiptBytes } from '../../services/escpos';
import { printerService } from '../../services/printerService';
import { operationRepository } from '../../repositories/operationRepository';
import { soundService } from '../../services/soundService';

interface WithdrawModalProps {
  student: Student;
  onClose: () => void;
  onSuccess: (protocolo: string) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  student,
  onClose,
  onSuccess,
}) => {
  const [valor, setValor] = useState<number>(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<number>(0);
  const [loadingPending, setLoadingPending] = useState<boolean>(true);
  const [step, setStep] = useState<'input' | 'confirm' | 'printing' | 'success' | 'error'>('input');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastProtocol, setLastProtocol] = useState<string>('');

  useEffect(() => {
    async function loadPending() {
      try {
        const total = await operationRepository.getPendingWithdrawalsTotal(student.id);
        setPendingWithdrawals(total);
      } finally {
        setLoadingPending(false);
      }
    }
    loadPending();
  }, [student.id]);

  // Saldo real disponível para novos saques (Saldo confirmado - Saques pendentes)
  const saldoEfetivoDisponivel = Math.max(0, student.saldo - pendingWithdrawals);

  const quickValues = [5, 10, 20, 50];

  const handleAddValue = (val: number) => {
    soundService.playNoteSound(val);
    setValor((prev) => {
      const next = prev + val;
      if (next > saldoEfetivoDisponivel) {
        setErrorMessage(
          `Valor ultrapassa o saldo disponível para saque (${formatQueimacash(saldoEfetivoDisponivel)}).`
        );
        return prev;
      }
      setErrorMessage(null);
      return next;
    });
  };

  const handleClear = () => {
    soundService.playNoteSound(5);
    setValor(0);
    setErrorMessage(null);
  };

  const handleProceedToConfirm = () => {
    if (valor <= 0) {
      setErrorMessage('Informe um valor maior que zero para o saque.');
      return;
    }
    if (valor > saldoEfetivoDisponivel) {
      setErrorMessage(
        `Saldo insuficiente. Seu saldo confirmado é ${formatQueimacash(student.saldo)}, mas você já possui ${formatQueimacash(pendingWithdrawals)} em saques pendentes.`
      );
      return;
    }
    setErrorMessage(null);
    setStep('confirm');
  };

  const handleExecutePrintAndWithdraw = async () => {
    setStep('printing');
    setErrorMessage(null);

    const protocolo = generateProtocol('SAQ');
    setLastProtocol(protocolo);
    const dataHoraStr = formatDateTime();

    try {
      // 1. Gera bytes ESC/POS com destaque de OPERACAO PENDENTE
      const receiptBytes = buildReceiptBytes({
        tipo: 'SAQUE',
        protocolo,
        dataHora: dataHoraStr,
        nomeAluno: student.nome,
        turma: student.turma,
        numeroConta: student.numeroConta,
        valor,
      });

      // 2. Envia bytes diretamente para a impressora via Web Bluetooth
      await printerService.printBytes(receiptBytes);

      // 3. SOMENTE APÓS O SUCESSO DA IMPRESSÃO FÍSICA cria a operação PENDENTE
      await operationRepository.createPendingOperation({
        protocolo,
        alunoId: student.id,
        alunoNome: student.nome,
        turma: student.turma,
        numeroConta: student.numeroConta,
        tipo: 'SAQUE',
        valor,
      });

      soundService.playSuccessSound();
      setStep('success');
    } catch (err: unknown) {
      const error = err as Error;
      // Em caso de falha: NÃO registra operação e NÃO altera saldo
      setErrorMessage(
        error.message || 'Falha ao imprimir comprovante térmico. Verifique a impressora e o papel.'
      );
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-sky-100 relative">
        {step !== 'printing' && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {/* ETAPA 1: Digitação do Saque */}
        {step === 'input' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <ArrowUpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-fredoka text-2xl font-bold text-slate-900">
                  Sacar Queimacash
                </h3>
                <p className="text-xs text-slate-500">
                  Escolha quanto deseja retirar com o professor
                </p>
              </div>
            </div>

            {/* Quadro de Saldo Disponível */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Saldo Confirmado Atual:</span>
                <span className="font-bold text-slate-800">{formatQueimacash(student.saldo)}</span>
              </div>
              {pendingWithdrawals > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Saques Pendentes em Aberto:</span>
                  <span>- {formatQueimacash(pendingWithdrawals)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-emerald-700 pt-1 border-t border-slate-200">
                <span>Disponível para este Saque:</span>
                <span className="font-fredoka text-base">{formatQueimacash(saldoEfetivoDisponivel)}</span>
              </div>
            </div>

            {/* Display do Valor Solicitado */}
            <div className="bg-amber-50/80 border-2 border-amber-200 rounded-2xl p-4 text-center mb-5">
              <span className="text-xs font-bold uppercase text-amber-800 tracking-wider">
                Valor do Saque Solicitado
              </span>
              <div className="font-fredoka text-4xl sm:text-5xl font-bold text-amber-700 my-1">
                {formatQueimacash(valor)}
              </div>
              <div className="text-xs text-slate-500">
                O professor entregará as notas após conferir seu comprovante impresso.
              </div>
            </div>

            {/* Botões rápidos */}
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                Adicionar valores rápidos:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {quickValues.map((val) => (
                  <button
                    key={val}
                    type="button"
                    disabled={valor + val > saldoEfetivoDisponivel}
                    onClick={() => handleAddValue(val)}
                    className="py-2.5 px-1 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 active:scale-95 disabled:opacity-40 text-slate-700 font-fredoka font-bold text-sm sm:text-base border border-slate-200 transition-all cursor-pointer"
                  >
                    +Q$ {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center gap-3 mb-6">
              <button
                type="button"
                onClick={handleClear}
                className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
              >
                Corrigir / Zerar
              </button>

              <button
                type="button"
                onClick={() => {
                  soundService.playNoteSound(50);
                  setValor(saldoEfetivoDisponivel);
                }}
                disabled={saldoEfetivoDisponivel <= 0}
                className="py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs transition-colors disabled:opacity-40 cursor-pointer"
              >
                Sacar Tudo ({formatQueimacash(saldoEfetivoDisponivel)})
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
                {errorMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handleProceedToConfirm}
              disabled={valor <= 0 || valor > saldoEfetivoDisponivel || loadingPending}
              className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 disabled:opacity-50 text-white font-fredoka font-bold text-lg shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              CONTINUAR PARA CONFIRMAÇÃO
            </button>
          </div>
        )}

        {/* ETAPA 2: Confirmação */}
        {step === 'confirm' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
              <Printer className="w-8 h-8" />
            </div>

            <h3 className="font-fredoka text-2xl font-bold text-slate-900 mb-2">
              Confirmar Saque?
            </h3>

            <p className="text-sm text-slate-600 mb-6">
              A impressora emitirá o comprovante de saque para você apresentar ao professor.
            </p>

            <div className="bg-sky-50 rounded-2xl p-5 mb-6 text-left space-y-2 border border-sky-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Aluno:</span>
                <span className="font-bold text-slate-800">{student.nome}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Turma / Conta:</span>
                <span className="font-bold text-slate-800">{student.turma} · {student.numeroConta}</span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-sky-200">
                <span className="font-bold text-slate-700">Valor a Sacar:</span>
                <span className="font-fredoka text-xl font-bold text-amber-700">
                  {formatQueimacash(valor)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs font-semibold mb-6">
              ⚠️ O saque só será deduzido oficialmente do seu saldo quando o professor confirmar a entrega do dinheiro.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
              >
                Voltar e Corrigir
              </button>

              <button
                type="button"
                onClick={handleExecutePrintAndWithdraw}
                className="py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-fredoka font-bold text-base shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                CONFIRMAR E IMPRIMIR
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 3: Imprimindo */}
        {step === 'printing' && (
          <div className="text-center py-8">
            <RefreshCw className="w-14 h-14 text-amber-600 animate-spin mx-auto mb-4" />
            <h3 className="font-fredoka text-2xl font-bold text-slate-900 mb-2">
              Imprimindo Comprovante de Saque...
            </h3>
            <p className="text-slate-600 text-sm">
              Enviando comandos ESC/POS via Web Bluetooth para a impressora.
            </p>
          </div>
        )}

        {/* ETAPA 4: Sucesso */}
        {step === 'success' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="font-fredoka text-2xl font-bold text-slate-900 mb-2">
              Comprovante Impresso!
            </h3>

            <p className="text-sm text-slate-600 mb-4">
              Pegue seu comprovante no Caixa e apresente ao professor para receber seu Queimacash físico.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 text-xs text-slate-600 font-mono">
              Protocolo: <strong className="text-slate-800">{lastProtocol}</strong>
            </div>

            <button
              type="button"
              onClick={() => onSuccess(lastProtocol)}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-fredoka font-bold text-base shadow-md cursor-pointer"
            >
              CONCLUIR OPERAÇÃO
            </button>
          </div>
        )}

        {/* ETAPA 5: Falha */}
        {step === 'error' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10" />
            </div>

            <h3 className="font-fredoka text-2xl font-bold text-slate-900 mb-2">
              Falha na Impressão
            </h3>

            <p className="text-sm text-slate-600 mb-4">
              A solicitação de saque <strong>não foi registrada</strong> porque o comprovante físico não pôde ser impresso.
            </p>

            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs mb-6 text-left">
              {errorMessage}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleExecutePrintAndWithdraw}
                className="py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-fredoka font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
