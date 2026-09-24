import React, { useState } from 'react';
import { X, ArrowDownCircle, Printer, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Student } from '../../domain/types';
import { formatQueimacash, generateProtocol, formatDateTime } from '../../utils/normalization';
import { buildReceiptBytes } from '../../services/escpos';
import { printerService } from '../../services/printerService';
import { operationRepository } from '../../repositories/operationRepository';
import { soundService } from '../../services/soundService';

interface DepositModalProps {
  student: Student;
  onClose: () => void;
  onSuccess: (protocolo: string) => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  student,
  onClose,
  onSuccess,
}) => {
  const [valor, setValor] = useState<number>(0);
  const [step, setStep] = useState<'input' | 'confirm' | 'printing' | 'success' | 'error'>('input');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastProtocol, setLastProtocol] = useState<string>('');

  const quickValues = [5, 10, 20, 50, 100];

  const handleAddValue = (val: number) => {
    soundService.playNoteSound(val);
    setValor((prev) => prev + val);
  };

  const handleClear = () => {
    soundService.playNoteSound(5);
    setValor(0);
  };

  const handleProceedToConfirm = () => {
    if (valor <= 0) {
      setErrorMessage('Informe um valor maior que zero para o depósito.');
      return;
    }
    setErrorMessage(null);
    setStep('confirm');
  };

  const handleExecutePrintAndDeposit = async () => {
    setStep('printing');
    setErrorMessage(null);

    const protocolo = generateProtocol('DEP');
    setLastProtocol(protocolo);
    const dataHoraStr = formatDateTime();

    try {
      // 1. Constrói bytes ESC/POS com aviso de OPERACAO PENDENTE
      const receiptBytes = buildReceiptBytes({
        tipo: 'DEPOSITO',
        protocolo,
        dataHora: dataHoraStr,
        nomeAluno: student.nome,
        turma: student.turma,
        numeroConta: student.numeroConta,
        valor,
      });

      // 2. Envia bytes diretamente para a impressora térmica via Web Bluetooth
      await printerService.printBytes(receiptBytes);

      // 3. SOMENTE APÓS O SUCESSO DA IMPRESSÃO REAL, registra a operação PENDENTE
      await operationRepository.createPendingOperation({
        protocolo,
        alunoId: student.id,
        alunoNome: student.nome,
        turma: student.turma,
        numeroConta: student.numeroConta,
        tipo: 'DEPOSITO',
        valor,
      });

      soundService.playSuccessSound();
      setStep('success');
    } catch (err: unknown) {
      const error = err as Error;
      // Em caso de falha: NÃO registra operação e NÃO altera saldo
      setErrorMessage(
        error.message || 'Falha ao imprimir na impressora térmica. Verifique o Bluetooth e o papel.'
      );
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-sky-100 relative">
        {/* Botão Fechar */}
        {step !== 'printing' && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {/* ETAPA 1: Digitação do Valor com correção */}
        {step === 'input' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ArrowDownCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-fredoka text-2xl font-bold text-slate-900">
                  Depositar Queimacash
                </h3>
                <p className="text-xs text-slate-500">
                  Adicione cédulas ou informe o valor a guardar
                </p>
              </div>
            </div>

            {/* Display de Valor */}
            <div className="bg-emerald-50/70 border-2 border-emerald-200 rounded-2xl p-4 text-center mb-5">
              <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">
                Valor do Depósito
              </span>
              <div className="font-fredoka text-4xl sm:text-5xl font-bold text-emerald-700 my-1">
                {formatQueimacash(valor)}
              </div>
              <div className="text-xs text-slate-500">
                O saldo será creditado após você entregar o valor ao professor.
              </div>
            </div>

            {/* Botões rápidos de cédulas Queimacash */}
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                Adicionar notas rápidas:
              </label>
              <div className="grid grid-cols-5 gap-2">
                {quickValues.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAddValue(val)}
                    className="py-2.5 px-1 rounded-xl bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 active:scale-95 text-slate-700 font-fredoka font-bold text-sm sm:text-base border border-slate-200 transition-all cursor-pointer"
                  >
                    +Q$ {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Teclado numérico / Limpar */}
            <div className="flex justify-between items-center gap-3 mb-6">
              <button
                type="button"
                onClick={handleClear}
                className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
              >
                Corrigir / Zerar
              </button>

              <div className="text-xs text-slate-400">
                Conta: {student.numeroConta}
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
                {errorMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handleProceedToConfirm}
              disabled={valor <= 0}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-fredoka font-bold text-lg shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              CONTINUAR PARA CONFIRMAÇÃO
            </button>
          </div>
        )}

        {/* ETAPA 2: Confirmação antes de imprimir */}
        {step === 'confirm' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
              <Printer className="w-8 h-8" />
            </div>

            <h3 className="font-fredoka text-2xl font-bold text-slate-900 mb-2">
              Confirmar Depósito?
            </h3>

            <p className="text-sm text-slate-600 mb-6">
              Ao confirmar, a impressora térmica emitirá seu comprovante físico.
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
                <span className="font-bold text-slate-700">Valor do Depósito:</span>
                <span className="font-fredoka text-xl font-bold text-emerald-700">
                  {formatQueimacash(valor)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs font-semibold mb-6">
              ⚠️ Este depósito ficará <strong>PENDENTE</strong> até você entregar o dinheiro e o comprovante ao professor.
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
                onClick={handleExecutePrintAndDeposit}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-fredoka font-bold text-base shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                CONFIRMAR E IMPRIMIR
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 3: Transmissão direta para a impressora Bluetooth */}
        {step === 'printing' && (
          <div className="text-center py-8">
            <RefreshCw className="w-14 h-14 text-emerald-600 animate-spin mx-auto mb-4" />
            <h3 className="font-fredoka text-2xl font-bold text-slate-900 mb-2">
              Imprimindo Comprovante...
            </h3>
            <p className="text-slate-600 text-sm">
              Enviando dados diretamente para a impressora térmica Bluetooth.
              Aguarde a saída do papel.
            </p>
          </div>
        )}

        {/* ETAPA 4: Sucesso após impressão real */}
        {step === 'success' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="font-fredoka text-2xl font-bold text-slate-900 mb-2">
              Comprovante Impresso!
            </h3>

            <p className="text-sm text-slate-600 mb-4">
              Destaque o comprovante que saiu na impressora e apresente ao seu professor.
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

        {/* ETAPA 5: Falha na impressão */}
        {step === 'error' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10" />
            </div>

            <h3 className="font-fredoka text-2xl font-bold text-slate-900 mb-2">
              Falha na Impressão
            </h3>

            <p className="text-sm text-slate-600 mb-4">
              A operação <strong>não foi concluída</strong> e seu saldo não foi alterado.
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
                Cancelar Operação
              </button>

              <button
                type="button"
                onClick={handleExecutePrintAndDeposit}
                className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-fredoka font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Imprimir Novamente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
